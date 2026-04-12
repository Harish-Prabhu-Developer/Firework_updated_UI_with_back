#!/bin/sh
echo "Running database migrations and seed..."
pnpm db:push
if [ $? -ne 0 ]; then
  echo "Drizzle push failed"
  exit 1
fi

pnpm db:seed
if [ $? -ne 0 ]; then
  echo "Database seed failed"
  exit 1
fi

echo "Starting server..."
pnpm start
