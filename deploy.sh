#!/bin/bash

# Deployment script for pixli-pro VPS
# Usage: ./deploy.sh

cd /var/www/pixli-pro.jamescutts.me/public_html
git checkout -- src/constants/spriteCollections.generated.ts 2>/dev/null || true
git pull origin main
npm install
npm run build
