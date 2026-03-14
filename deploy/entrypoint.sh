#!/bin/sh
set -e

echo "==> Initializing database..."
node init-db.mjs

echo "==> Starting FinanceHub..."
exec node_modules/.bin/next start
