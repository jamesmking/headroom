# Headroom

A personal daily command centre for working across several teams at once.

Headroom answers three questions quickly:

- **What meetings do I have today?**
- **When am I available?**
- **What should I be working on next?**

It is a planning tool, not an integration layer. Meetings and tasks are entered by hand, because the
calendars and Jira boards they mirror sit behind separate VPNs, tenancies and permissions that
cannot be joined up programmatically. The one exception is a read-only family calendar, pulled from
an iCal feed.

## Contents

- [How it is put together](#how-it-is-put-together)
- [Getting started](#getting-started)
- [Google OAuth setup](#google-oauth-setup)
- [Environment variables](#environment-variables)
- [Deploying to Headroom Cloud](#deploying-to-headroom-cloud)
- [Data model](#data-model)
- [How availability is calculated](#how-availability-is-calculated)
- [How the family calendar works](#how-the-family-calendar-works)
- [Project structure](#project-structure)
- [Scripts](#scripts)

## How it is put together

| Layer     | Choice                                                      |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16, App Router, React 19, TypeScript                |
| Rendering | Server Components for reads, Server Actions for writes      |
| Styling   | SCSS Modules with a small token system                      |
| Auth      | Auth.js v5 with the Google provider and an email allow-list |
| Database  | PostgreSQL via Prisma                                       |
| Packaging | Standalone Node.js server in a container                    |

There is no REST or GraphQL layer: pages read through query functions in `src/features/*/queries`,
and forms post to Server Actions in `src/features/*/actions`. Nothing depends on a specific hosting
provider — no edge runtime, no vendor storage, no platform-specific primitives. The whole
application is a Node process that needs a `DATABASE_URL`.

### Times are wall-clock, not instants

Meetings are stored as a **date** plus **start and end minutes from midnight**, rather than as
absolute timestamps. A 10:00 stand-up stays at 10:00 across a daylight-saving change, recurrence
expansion is a simple day-offset test, and availability becomes integer arithmetic. iCal events —
which genuinely are absolute instants — are converted into the same shape on the way in, using the
timezone configured in Settings.

## Getting started

Requirements: Node.js 22+, Docker (for the local database).

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Configure
cp .env.example .env
#    Then set AUTH_SECRET and ALLOWED_EMAILS at a minimum.
npx auth secret            # writes a strong AUTH_SECRET for you

# 4. Create the schema
npm run db:migrate

# 5. Optional: load demo roles, meetings and tasks
npm run db:seed

# 6. Run it
npm run dev
```

Open http://localhost:3000.

### Signing in before Google is configured

Setting up a Google OAuth client takes a few minutes. To try the application first, set both of
these in `.env`:

```
HEADROOM_DEV_LOGIN="true"
ALLOWED_EMAILS="you@example.com"
```

A "Development sign-in" box then appears on the sign-in page. It is gated three ways and **cannot**
be switched on in a production build:

1. `NODE_ENV` must not be `production`
2. `HEADROOM_DEV_LOGIN` must be exactly `true`
3. The address must still pass the `ALLOWED_EMAILS` allow-list

Once Google sign-in works, remove the variable — and if you would rather it did not exist at all,
delete `src/features/auth/dev-login.ts`, its `src/features/auth/components/dev-sign-in` component,
and the two references to them in `src/auth.ts` and `src/app/signin/page.tsx`.

## Google OAuth setup

1. In the [Google Cloud console](https://console.cloud.google.com/apis/credentials), create an
   **OAuth client ID** of type **Web application**.
2. Add authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` for development
   - `https://headroom.cloud/api/auth/callback/google` for production
3. Put the client ID and secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

No Google scopes beyond basic profile and email are requested. Headroom never reads your Google
Calendar, mail or files.

### Access control

Authenticating with Google is not enough on its own. The `signIn` callback checks the address
against `ALLOWED_EMAILS`, and an account that is not listed never receives a session — it is
returned to the sign-in page with an explanation.

```
ALLOWED_EMAILS=me@example.com,another@example.com
```

The rule lives in one place, `src/features/auth/access.ts`. Replacing the environment variable with
an invite table or a domain rule later means changing that file and nothing else. Every record is
already owned by a `userId`, so supporting more people needs no schema change.

## Environment variables

| Variable                    | Required       | Purpose                                                        |
| --------------------------- | -------------- | -------------------------------------------------------------- |
| `DATABASE_URL`              | yes            | PostgreSQL connection string                                   |
| `AUTH_SECRET`               | yes            | Signs session cookies. Generate with `npx auth secret`         |
| `AUTH_GOOGLE_ID`            | yes            | Google OAuth client ID                                         |
| `AUTH_GOOGLE_SECRET`        | yes            | Google OAuth client secret                                     |
| `AUTH_URL`                  | in production  | Canonical URL, e.g. `https://headroom.cloud`                   |
| `AUTH_TRUST_HOST`           | behind a proxy | Set to `true` when running behind a reverse proxy              |
| `ALLOWED_EMAILS`            | yes            | Comma-separated allow-list. Empty means nobody may sign in     |
| `FAMILY_ICAL_URL`           | no             | Seeds the family calendar on first sign-in                     |
| `FAMILY_ICAL_CACHE_SECONDS` | no             | Feed cache lifetime, default `900`                             |
| `RUN_MIGRATIONS`            | no             | Container only. `false` skips migrations at start-up           |
| `HEADROOM_DEV_LOGIN`        | no             | Development only. Enables the sign-in shortcut described above |

No secret is ever exposed to the browser. Nothing is prefixed `NEXT_PUBLIC_`.

## Deploying to Headroom Cloud

The application is packaged as a standard container. Build and run it anywhere:

```bash
docker build -t headroom:latest .

docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/headroom" \
  -e AUTH_SECRET="..." \
  -e AUTH_GOOGLE_ID="..." \
  -e AUTH_GOOGLE_SECRET="..." \
  -e AUTH_URL="https://headroom.cloud" \
  -e AUTH_TRUST_HOST="true" \
  -e ALLOWED_EMAILS="you@example.com" \
  headroom:latest
```

The image:

- runs as an unprivileged user (`nextjs`, uid 1001)
- listens on `PORT` (default 3000) and binds `0.0.0.0`
- applies pending migrations on start-up, before accepting traffic
- exposes `GET /api/health` for liveness checks, and declares a `HEALTHCHECK`

`/api/health` reports database reachability in its body but still answers `200` while the database
is down — restarting the container would not fix a database outage, and a failing check would turn a
brief blip into a restart loop.

### Migrations

By default the entrypoint runs `prisma migrate deploy` before starting the server. If you run more
than one replica, or prefer an explicit release step, set `RUN_MIGRATIONS=false` and run migrations
once per deploy instead:

```bash
docker run --rm -e DATABASE_URL="..." --entrypoint sh headroom:latest \
  -c "./migrator/node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma"
```

### Behind a reverse proxy

Set `AUTH_URL` to the public URL and `AUTH_TRUST_HOST=true`, and forward `X-Forwarded-Proto` and
`X-Forwarded-Host` so callback URLs are built correctly.

## Data model

```
User ──┬── UserSettings   working hours, timezone, family iCal feed
       ├── Role           name, short name, colour, description, active
       ├── Meeting        date + start/end minutes, role, notes, recurrence
       ├── Task           title, role, Jira URL, due date, status, notes
       └── DailyTask      "I intend to work on this task on this day"
```

`DailyTask` is the important one. **A task being due today and a task you have chosen to work on
today are different things**, so choosing what to do today never means inventing a deadline.
Selecting a task adds a `DailyTask` row for that date; `dueDate` stays untouched and optional.

Roles are archived, never deleted, when they have history attached. Meetings and tasks keep pointing
at the archived role, so past records keep their name and colour. The Delete control only appears on
a role that nothing references.

Every table carries a `userId`, so this is already a multi-user schema being used by one person.

## How availability is calculated

`src/features/availability/availability.ts` is pure, dependency-free and covered by unit tests.
Given the day's events and the configured working hours it:

1. discards all-day events, which occupy no specific slot
2. clips every event to the working day
3. merges overlapping and back-to-back events into single busy blocks
4. subtracts those from the working day to leave the gaps

Time outside working hours is never reported as available, so a free evening does not read as
capacity. Overlapping meetings are counted once. Back-to-back meetings produce no zero-length gap
between them.

The Today screen also derives _what is happening now_: the meeting in progress, the next one, how
long until it starts, and how much uninterrupted time you have before it.

## How the family calendar works

- The feed URL is stored per user and read **only** on the server. It is never included in any
  payload sent to the browser. Settings shows the feed's host so you can confirm what is configured,
  but never the path — which is where the secret in a private calendar URL lives.
- The feed is fetched server-side with an 8 second timeout and a 5 MB ceiling, then parsed and
  expanded into per-day events.
- Results are cached in-process for `FAMILY_ICAL_CACHE_SECONDS` (default 15 minutes), so leaving the
  Today screen open all day does not hammer the provider.
- **Failure is contained.** The fetcher never throws. If the feed is slow, broken or offline, the
  last good copy is served and marked stale; if there is no cached copy, the page renders an inline
  warning and everything else — the timeline, availability, tasks — carries on working.
- Family events are read-only. They are distinguished by a hatched texture and a hollow marker as
  well as by colour, so they are not identified by colour alone.
- `webcal://` URLs are accepted and treated as `https://`.

Saving a URL in Settings fetches it once and reports how many events were found, so a typo is caught
immediately rather than showing up as a silently empty calendar.

## Project structure

```
prisma/                     schema, migrations, demo seed
src/
  app/
    (app)/                  authenticated screens
      page.tsx              Today — the default screen
      week/                 Week
      tasks/                Backlog / To do / Done
      settings/             Roles, working day, family calendar, account
    signin/                 Sign-in
    api/auth/[...nextauth]/ Auth.js route handlers
    api/health/             Liveness endpoint
  components/               shared UI primitives
  features/
    auth/                   access control, session helpers, bootstrap
    availability/           free-period calculation (pure, tested)
    calendar/               shared event types, day/week composition
    family-calendar/        iCal fetching, caching and parsing
    meetings/               meeting queries, actions, recurrence, form
    roles/                  role queries, actions, management UI
    settings/               settings queries and actions
    tasks/                  task queries, actions, list and form
  lib/                      dates, times, Prisma client, env, action results
  styles/                   tokens, mixins, global stylesheet
  auth.ts                   full Auth.js configuration
  auth.config.ts            edge-safe subset used by the proxy
  proxy.ts                  route protection (Next 16's middleware)
```

Two conventions worth knowing:

- **Single-click mutations take `FormData` directly and return nothing**
  (`*/actions/quick-actions.ts`). Multi-field forms that need validation feedback use
  `useActionState` instead. Keeping status changes, plan changes and deletions as plain form posts
  means they can only ever happen because a button was pressed.
- **Every query is scoped by `userId`**, and updates use `updateMany`/`deleteMany` with a `userId`
  in the `where` clause, so one user's id can never be used to reach another's row.

## Scripts

| Command              | What it does                                |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Development server                          |
| `npm run build`      | Production build                            |
| `npm start`          | Run the production build                    |
| `npm test`           | Unit tests                                  |
| `npm run type`       | TypeScript check                            |
| `npm run lint`       | ESLint                                      |
| `npm run format`     | Prettier                                    |
| `npm run db:migrate` | Create and apply a migration in development |
| `npm run db:deploy`  | Apply migrations (production)               |
| `npm run db:seed`    | Load demo data                              |
| `npm run db:studio`  | Prisma Studio                               |

## Accessibility

Desktop-first but responsive. Semantic HTML throughout, a skip link, a single high-contrast focus
treatment on every interactive element, colour never used as the only signal, and text contrast
checked against WCAG AA. All controls are reachable and operable by keyboard; there are no modals.

## Deliberately not included

No Jira, Outlook, Microsoft 365 or Google Calendar integration. Google is used for sign-in only. No
collaboration, workspaces, notifications, reporting, time tracking, chat, comments, attachments or
role-based permissions. The value of this application is that it stays small enough to keep open all
day.
