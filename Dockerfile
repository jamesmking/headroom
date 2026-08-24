# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Headroom — production image
#
# A plain Node.js web server in a container. It has no dependency on any
# particular hosting provider: give it a DATABASE_URL and the auth environment
# variables and it runs anywhere that can run a container.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=22-alpine

# --- Dependencies ----------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# libc6-compat keeps the Prisma engine happy on Alpine.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
# `npm ci` runs the postinstall `prisma generate`, which needs the schema above.
RUN npm ci

# --- Build -----------------------------------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nothing secret is needed to compile; all pages are rendered on demand.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# --- Migration CLI ---------------------------------------------------------
# The Prisma CLI is installed on its own rather than taken from the app's
# dependency tree, so the runtime image does not end up carrying a second copy
# of Next.js and the build-time toolchain just to run `migrate deploy`.
FROM node:${NODE_VERSION} AS migrator
WORKDIR /migrator

RUN apk add --no-cache libc6-compat

COPY package.json ./source-package.json
RUN PRISMA_VERSION="$(node -p "require('./source-package.json').devDependencies.prisma")" \
  && npm init -y > /dev/null \
  && npm install --omit=dev --no-audit --no-fund "prisma@${PRISMA_VERSION}"

# --- Runtime ---------------------------------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone build carries only the modules the server actually needs,
# including the Prisma client and its query engine.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Schema and migration history, plus the isolated CLI that applies them.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=migrator --chown=nextjs:nodejs /migrator/node_modules ./migrator/node_modules

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
