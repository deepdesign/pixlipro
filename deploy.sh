#!/bin/bash

# Pixli Pro Deployment Script for Hostinger VPS
# Run this script from the VPS terminal

set -e  # Exit on error

echo "🚀 Starting Pixli Pro deployment..."

# Navigate to project directory
cd /var/www/pixli-pro.jamescutts.me/public_html

echo "📦 Pulling latest changes from git..."
git pull origin main

echo "📥 Installing/updating dependencies..."
npm install

echo "🔨 Building production bundle..."
npm run build

echo "✅ Deployment complete!"
echo "📁 Production files are in the /dist directory"
echo "🌐 Your site should now be live with the latest changes"
