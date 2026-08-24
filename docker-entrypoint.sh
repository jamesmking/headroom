#!/bin/sh
set -e

# Apply any pending database migrations before the server accepts traffic.
# Set RUN_MIGRATIONS=false when migrations are handled by a separate deploy
# step, for example a release job that runs once rather than once per replica.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  ./migrator/node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma
fi

exec "$@"
