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
- [Deploying](#deploying)
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

| Variable                    | Required       | Purpose                                                                         |
| --------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`              | yes            | PostgreSQL connection string. Use the pooled string if there is a pooler        |
| `DIRECT_URL`                | yes            | Unpooled connection, used for migrations. Same as `DATABASE_URL` with no pooler |
| `AUTH_SECRET`               | yes            | Signs session cookies. Generate with `npx auth secret`                          |
| `AUTH_GOOGLE_ID`            | yes            | Google OAuth client ID                                                          |
| `AUTH_GOOGLE_SECRET`        | yes            | Google OAuth client secret                                                      |
| `AUTH_URL`                  | in production  | Canonical URL, e.g. `https://headroom.cloud`                                    |
| `AUTH_TRUST_HOST`           | behind a proxy | Set to `true` when running behind a reverse proxy                               |
| `ALLOWED_EMAILS`            | yes            | Comma-separated allow-list. Empty means nobody may sign in                      |
| `FAMILY_ICAL_URL`           | no             | Seeds the family calendar on first sign-in                                      |
| `FAMILY_ICAL_CACHE_SECONDS` | no             | Feed cache lifetime, default `900`                                              |
| `RUN_MIGRATIONS`            | no             | Container only. `false` skips migrations at start-up                            |
| `HEADROOM_DEV_LOGIN`        | no             | Development only. Enables the sign-in shortcut described above                  |

No secret is ever exposed to the browser. Nothing is prefixed `NEXT_PUBLIC_`.

## Deploying

The application is a plain Next.js server. It runs on Vercel, and it runs as a container anywhere
else — nothing in the code is tied to either.

### Vercel

The deployed setup is Vercel + Neon Postgres, serving `headroom.cloud`.

**1. Provision the database.** In the Vercel dashboard, add **Neon** from the Marketplace and attach
it to the project. Neon injects a pooled `DATABASE_URL` plus an unpooled `DATABASE_URL_UNPOOLED`
(also exposed as `POSTGRES_URL_NON_POOLING`).

**2. Set the environment variables.** In **Settings → Environment Variables**, scoped to
**Production**:

| Variable             | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon's **pooled** string, with `?pgbouncer=true&connect_timeout=15` appended |
| `DIRECT_URL`         | Neon's **unpooled** string (copy of `DATABASE_URL_UNPOOLED`)                 |
| `AUTH_SECRET`        | `npx auth secret`, or `openssl rand -base64 32`                              |
| `AUTH_GOOGLE_ID`     | Google OAuth client ID                                                       |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret                                                   |
| `AUTH_URL`           | `https://headroom.cloud`                                                     |
| `AUTH_TRUST_HOST`    | `true`                                                                       |
| `ALLOWED_EMAILS`     | Your address                                                                 |

`DIRECT_URL` must be present even though migrations run from your machine: Prisma validates the
whole datasource block during `prisma generate`, which runs in the Vercel build.

`pgbouncer=true` matters. Every serverless instance opens its own connection, and it tells Prisma to
stop using prepared statements, which a transaction-mode pooler cannot hold.

Do **not** set `HEADROOM_DEV_LOGIN`. It is inert in a production build, but leaving it unset keeps
the intent obvious.

**3. Point Google at the domain.** In the
[Google Cloud console](https://console.cloud.google.com/apis/credentials), add this authorised
redirect URI to the OAuth client:

```
https://headroom.cloud/api/auth/callback/google
```

**4. Attach the domain.** Add `headroom.cloud` under **Settings → Domains** and point DNS at Vercel.

**4a. Keep the functions next to the database.** `vercel.json` pins the region to `fra1`, because
the Neon database is in Frankfurt. Vercel's default is `iad1` (Washington), which puts the Atlantic
between every query and its answer: at roughly 90 ms round trip, a cold Postgres connection costs
about four of those in TLS setup alone, before a row is read. If the database is ever moved, move
this with it — the two settings only work as a pair.

**5. Apply migrations.** Production deployments apply them automatically, so this is needed only for
the first deployment, or to adopt a database that predates the migration history:

```bash
DATABASE_URL="<neon-pooled>" DIRECT_URL="<neon-unpooled>" npm run db:deploy
```

**6. Deploy.** Push to `main`; Vercel builds from the connected GitHub repository. Vercel runs the
`vercel-build` script in preference to `build`, so the build command is `./vercel-build.sh`. That
script always runs `prisma generate` — Vercel restores a cached `node_modules`, so the `postinstall`
hook cannot be relied on to produce a client matching the schema — and then runs
`prisma migrate deploy` **only when `VERCEL_ENV` is `production`**. A preview build points at
whatever `DATABASE_URL` it is given, often the production one, so migrating from a preview would let
an unmerged branch reshape live data.

Two things follow from applying migrations during a build. A rolled-back deployment does not roll
back its migrations, so keep them additive and deploy destructive changes on their own. And if an
explicit **Build Command** is set under _Settings → Build and Deployment_, it overrides the
`vercel-build` script — leave that setting on the default.

The container path is unchanged. It builds with `npm run build` and applies migrations at container
start from `docker-entrypoint.sh`.

#### Two things to know about preview deployments

Preview builds get their own `*.vercel.app` URL, which is not a registered Google redirect URI, so
**sign-in will not work on a preview** unless you add that exact URL to the OAuth client. This is a
Google restriction rather than an application one.

Previews share whatever database you point them at. Leave `DATABASE_URL` scoped to Production only,
or give previews their own Neon branch, so a preview cannot write to real data.

#### The family calendar on serverless

The iCal feed is cached through the framework data cache, which on Vercel is shared across instances
— so the calendar provider is polled roughly once per `FAMILY_ICAL_CACHE_SECONDS`, not once per
render. The in-process cache underneath it holds the last known-good copy for serving stale data
during an outage; a cold instance starts without one, in which case a broken feed degrades to the
inline "unavailable" notice instead. Either way the rest of the page is unaffected.

### As a container

For Headroom Cloud, a VPS, or anything else that runs a container. The image builds a standalone
Node server, which is skipped automatically on Vercel.

```bash
docker build -t headroom:latest .

docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/headroom" \
  -e DIRECT_URL="postgresql://user:password@host:5432/headroom" \
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

#### Migrations

By default the entrypoint runs `prisma migrate deploy` before starting the server. If you run more
than one replica, or prefer an explicit release step, set `RUN_MIGRATIONS=false` and run migrations
once per deploy instead:

```bash
docker run --rm -e DATABASE_URL="..." -e DIRECT_URL="..." --entrypoint sh headroom:latest \
  -c "./migrator/node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma"
```

#### Behind a reverse proxy

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

### Every meeting and task has a role

`Meeting.roleId` and `Task.roleId` are **required**, enforced at three levels: `NOT NULL` in
Postgres, a required field in the Zod schema behind each Server Action, and an ownership check that
rejects a role id belonging to somebody else. Making the form field required is not on its own
enough — the constraint has to hold when the form is bypassed.

Imported family calendar events are the one exception, and they need no exception in the schema:
they are built in memory from the iCal feed on every request and never stored, so they carry the
synthetic `FAMILY_ROLE` (`features/family-calendar/family-role.ts`) rather than a database row. It
can therefore never appear in a role picker, be renamed, archived or deleted.

An account with no active roles cannot create anything. Rather than disabling every add control, the
meeting and task forms render a "create a role first" prompt in place of the fields, so every entry
point — the panel button, a gap in the day, a slot in the week — explains itself identically.

Roles are archived, never deleted, when they have history attached. The foreign keys are
`onDelete: Restrict`, which matches what the UI already enforced: the Delete control only appears on
a role that nothing references. Meetings and tasks keep pointing at the archived role, so past
records keep their name and colour, and the role picker offers an archived role only when it is
already the current value — editing an old meeting never silently reassigns it, and nothing new can
be filed under a role that has been put away.

Roles are ordered by hand from Settings, and that order is used everywhere they are listed — the
role filter on Tasks, and the role menus on meetings and tasks. Move up / move down controls are
used rather than drag-and-drop: with a handful of roles they are quicker, work without JavaScript,
and are operable from the keyboard. Focus follows the role being moved, so pressing "move up" twice
moves the same role twice. Every move renumbers `sortOrder` across the whole list, so gaps and
duplicates cannot accumulate and the order is never ambiguous. Active and archived roles are ordered
within their own groups.

Every table carries a `userId`, so this is already a multi-user schema being used by one person.

## Overlapping and optional meetings

Working across several teams means being booked twice at once, so overlaps are **legitimate data**,
not an error to resolve.

**Overlaps are grouped, never stacked.** `groupOverlapping` collects events into contiguous runs and
`placeInColumns` assigns each a column, so a group is drawn side by side. Rendering 10:00–11:00 and
10:30–11:30 as consecutive rows would read as back-to-back meetings, which is the opposite of the
truth. Blocks inside a group size to their own content rather than to their share of the span: a
proportional height looks right in a sketch and fails on a real screen, where a thirty-minute block
in one of four columns is shorter than the text it has to hold.

**Only a collision between commitments is a clash.** `clash` is true when two or more _committed_
events genuinely overlap — checked with a sweep, because a group can chain (A overlaps B, B overlaps
C, A and C never meet). A required meeting overlapping an optional one is expected and stays quiet.

**Optional meetings never reduce availability.** `Meeting.optional` marks something you would join
if you were free, so counting it as busy would report the opposite of the truth. Free time is
calculated from committed events only; family calendar events are always committed, because a school
pickup genuinely blocks you. An optional meeting is never hidden — it is drawn _inside_ the free
time it competes for, and `totalOptionalMinutes` reports how much of the free figure has something
asking for it. `findNextUp` follows the same rule: "next meeting" is the next committed one, with an
earlier optional meeting shown beneath it rather than instead of it.

The distinction is carried by texture, not colour — dashed edges, a flatter surface and an
"Optional" tag — so the role colour stays free to mean what it always means. Role and attendance are
two different pieces of information.

## How availability is calculated

`src/features/availability/availability.ts` is pure, dependency-free and covered by unit tests.
Given the day's events and the configured working hours it:

1. discards all-day events, which occupy no specific slot
2. keeps only events that actually claim the time — see below
3. clips every event to the working day
4. merges overlapping and back-to-back events into single busy blocks
5. subtracts those from the working day to leave the gaps

Every event carries a `claim`, which is what step 2 reads:

| Claim           | Takes the time? | Where it shows                                             |
| --------------- | --------------- | ---------------------------------------------------------- |
| `required`      | Yes             | Everywhere. This is what availability is calculated from.   |
| `optional`      | No              | Drawn inside the gap it competes for, and counted as "optional" time so you can see what is being asked of your free hours. |
| `informational` | No              | Drawn inside the gap for reference only. Absent from every total and from Now/Next. |

`claim` is deliberately independent of `source`: it says what an event does to your day, not where
it came from. Meetings derive theirs from the `optional` checkbox; family calendar events are mapped
to `informational` in `parse-ics.ts`, which is the single place that decision is made.

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
- **They are information, not commitments.** A family event never reduces your reported
  availability, never counts as a clash with a meeting, and never appears in the day's totals or in
  the Now/Next band. It is drawn on the timeline so you can see it coming, and nothing more. The
  reasoning: these appointments mirror a calendar you are not the attendee of, so treating them as
  busy reported the opposite of the truth about your working day.
- **They are never grouped with a meeting.** A meeting running over the school run is not an overlap
  worth drawing a box around, so a family event never forms or joins an overlapping cluster. The
  meeting stays an ordinary block; the family event sits in whichever gap it falls in, or on its own
  row where the day is too full to have one.
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
      day/[date]/           Any other date, e.g. /day/2026-09-01
      week/                 This week
      week/[date]/          The week containing a date
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
    roles/                  role queries, actions, ordering, management UI,
                            last-used-role memory, the create-a-role prompt
    settings/               settings queries and actions
    tasks/                  task queries, actions, list and form
  lib/                      dates, times, Prisma client, env, action results
  styles/                   tokens, mixins, global stylesheet
  auth.ts                   full Auth.js configuration
  auth.config.ts            edge-safe subset used by the proxy
  proxy.ts                  route protection (Next 16's middleware)
```

### Routing dates

`/` is Today and `/week` is this week, so a bookmark of either always means "the day (or week) I am
in" rather than the one it was bookmarked on. Every other date is addressable at `/day/<date>` and
`/week/<date>`, and both dated routes redirect to the plain path when the date turns out to be the
current one — so there is exactly one URL for today, and paging back from tomorrow lands on home.

Today and any other day are the same component (`features/calendar/components/day-view`) given a
different date; the same is true of the week. Only three things vary with the date: the band across
the top (`NowNext` today, `DayShape` otherwise), whether the now-line is drawn, and the wording.

Three conventions worth knowing:

- **Single-click mutations take `FormData` directly and return nothing**
  (`*/actions/quick-actions.ts`). Multi-field forms that need validation feedback use
  `useActionState` instead. Keeping status changes, plan changes and deletions as plain form posts
  means they can only ever happen because a button was pressed.
- **Every query is scoped by `userId`**, and updates use `updateMany`/`deleteMany` with a `userId`
  in the `where` clause, so one user's id can never be used to reach another's row.
- **Client Components receive route templates, not functions.** A function cannot cross the server
  boundary, so anything building a URL from a date the user has not chosen yet — the date picker —
  is handed `dayPathTemplate` / `weekPathTemplate` and fills in the placeholder itself.

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

## Responsive and touch

Three layout modes, chosen so each width gets the shape that suits it rather than a shrunken version
of the one above.

| Width      | Week                                 | Day                                       |
| ---------- | ------------------------------------ | ----------------------------------------- |
| ≥ 1181px   | Seven columns                        | Timeline beside the task lists            |
| 901–1180px | Seven narrower columns               | Single column below 1100px                |
| ≤ 900px    | **Agenda** — days stacked vertically | —                                         |
| ≤ 560px    | Agenda                               | Time rail dropped, overlap groups restack |

**The week becomes an agenda below 900px.** Seven columns on a phone stop being a week at a glance:
you can see two of them, and finding out whether Friday is busy means scrolling sideways. The agenda
is the same markup, the same chips and the same click handlers restyled by CSS alone — no second
component and nothing to keep in sync. Days with nothing in them collapse to a single line, so an
empty week stays one short scroll.

There is deliberately **no horizontal scroller anywhere**. An `overflow-x: auto` grid clipped its
own content correctly but still inflated the document's scroll area, letting the whole page slide
sideways. Seven flexible columns with no minimum width avoid the problem entirely.

**The time rail is dropped below 560px.** It costs 68px — a fifth of a 320px screen — to repeat a
time every block already prints. Gap rows print their own start time instead. That reclaimed width
is what makes overlapping meetings legible on a phone, where a group restacks into full-width blocks
inside its bounding box rather than sitting side by side.

**Touch targets are 44px on coarse pointers only** (`@media (pointer: coarse)`), so a mouse-driven
UI keeps its density. `helpers/_buttons.scss` holds the shared `$touch-target` value. Nothing
essential depends on hover: the controls that fade in on a pointer are always visible on touch, and
in the agenda they are always visible regardless of what the media query reports.

## Feeling fast

The application runs on serverless functions and a database that both sleep when idle, so a cold
request costs a second or two whatever the code does. Most of the work here is therefore about the
wait being _legible_ rather than shorter.

**Every mutation acknowledges the press.** `Button` is pending-aware by default for submits rather
than opt-in — waiting with no feedback is what makes an application feel broken rather than busy, so
it has to be switched off deliberately instead of remembered every time. The bespoke controls use
`FormButton`, which exists as a separate component because `useFormStatus` reads the form it is
rendered _inside_: a component that renders both the `<form>` and its button sees no form at all.
Only the pressed button shows a spinner, while every control in the form locks, so a second action
cannot be fired into a request already in flight.

**Every route has a loading boundary.** The obvious benefit is that a navigation no longer freezes
the page you are leaving. The less obvious one matters more: Next only prefetches a dynamic route as
far as its nearest loading boundary, so with no boundary at all `<Link>` prefetching does nothing
and every navigation pays for a cold round trip.

**The two most-pressed controls do not wait at all.** Task status and the plan toggle use
`useOptimistic`: they move immediately and reconcile when the server answers, including on failure,
which shows up as the row springing back rather than as a silent lie. This is the one place the
application depends on JavaScript to reflect a change — the form still posts a real server action
either way.

**Fewer round trips per render.** `getSettings` and `getCurrentUser` are wrapped in React's `cache`,
because a Day render asks for settings three times over — the route needs the timezone, the view
needs the working hours, the calendar needs the feed URL. The meeting query now returns the editable
records alongside the events rather than making the page fetch them again from rows it had already
loaded. Together that took a Day render from nine database queries to seven.

## Accessibility

Desktop-first but responsive. Semantic HTML throughout, a skip link, a single high-contrast focus
treatment on every interactive element, colour never used as the only signal, and text contrast
checked against WCAG AA. All controls are reachable and operable by keyboard; there are no modals.

Escape closes anything that opened in place. Inline editors deliberately do **not** close on a click
outside — losing a half-written meeting to a stray click would cost far more than reaching for
Cancel — while the date picker, which holds nothing, does.

## Deliberately not included

No Jira, Outlook, Microsoft 365 or Google Calendar integration. Google is used for sign-in only. No
collaboration, workspaces, notifications, reporting, time tracking, chat, comments, attachments or
role-based permissions. The value of this application is that it stays small enough to keep open all
day.
