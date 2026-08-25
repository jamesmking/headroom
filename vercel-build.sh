#!/bin/sh
set -e

# Build command for Vercel.
#
# Vercel runs `vercel-build` in preference to `build` when the script exists, so
# this file is the serverless counterpart to docker-entrypoint.sh: the container
# path still uses `npm run build` and applies migrations at container start,
# and neither path needs to know about the other.
#
# `prisma generate` runs on every deployment because Vercel restores a cached
# node_modules, so the postinstall hook cannot be relied on to produce a client
# that matches the schema.
prisma generate

# Migrations are applied for production deployments only. A preview build points
# at whatever DATABASE_URL it is given — often the production database — so
# migrating from a preview would let an unmerged branch reshape live data.
#
# Note that a rolled-back deployment does not roll back its migrations. Keep
# migrations additive and deploy destructive changes on their own.
if [ "$VERCEL_ENV" = "production" ]; then
  echo "VERCEL_ENV=production: applying database migrations..."
  prisma migrate deploy
else
  echo "VERCEL_ENV=${VERCEL_ENV:-unset}: skipping migrations (production only)."
fi

next build
