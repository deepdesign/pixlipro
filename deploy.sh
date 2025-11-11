#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/var/www/bitlab.jamescutts.me"
PUBLISH_DIR="$REPO_DIR/html"

printf "\n==> Deploying BitLab to %s\n" "$PUBLISH_DIR"

cd "$REPO_DIR"

echo "==> Fetching latest changes"
git fetch --all --prune

echo "==> Resetting to origin/main"
git reset --hard origin/main

echo "==> Installing dependencies"
npm install --silent

echo "==> Building production bundle"
npm run build

echo "==> Publishing to $PUBLISH_DIR"
rsync -av --delete dist/ "$PUBLISH_DIR/"

echo "==> Deploy complete"
