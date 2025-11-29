# Deployment Guide for Hostinger VPS

## Initial Setup (First Time Only)

If the directory is empty or not a git repository, clone it:

```bash
# Navigate to parent directory
cd /var/www/pixli-pro.jamescutts.me

# Remove existing public_html if it exists and is empty/not needed
# OR backup existing files first!

# Clone the repository
git clone https://github.com/deepdesign/pixlipro.git public_html

# Navigate into the cloned directory
cd public_html

# Install dependencies
npm install

# Build for production (skips TypeScript type checking for faster deployment)
npm run build:skip-check
```

## Regular Deployment (After Initial Setup)

Once the repository is cloned, use these commands for updates:

```bash
cd /var/www/pixli-pro.jamescutts.me/public_html
git pull origin main
npm install
npm run build
```

## Alternative: Initialize Git in Existing Directory

If you already have files in the directory and want to set up git:

```bash
cd /var/www/pixli-pro.jamescutts.me/public_html

# Initialize git repository
git init

# Add remote repository
git remote add origin https://github.com/deepdesign/pixlipro.git

# Fetch and merge
git fetch origin
git checkout -b main
git reset --hard origin/main

# Install dependencies and build
npm install
npm run build
```

## Quick Deploy Commands

### First Time Setup:
```bash
cd /var/www/pixli-pro.jamescutts.me && git clone https://github.com/deepdesign/pixlipro.git public_html && cd public_html && npm install && npm run build
```

### Regular Updates:
```bash
cd /var/www/pixli-pro.jamescutts.me/public_html && git pull origin main && npm install && npm run build
```

## Web Server Configuration

### If using Apache
Make sure your `.htaccess` or virtual host is configured to:
- Serve `index.html` from the `/dist` directory
- Handle client-side routing (SPA)

### If using Nginx
Configure your server block to serve from the `/dist` directory:

```nginx
server {
    listen 80;
    server_name pixli-pro.jamescutts.me;
    root /var/www/pixli-pro.jamescutts.me/public_html/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Troubleshooting

### Build fails
- Check Node.js version: `node --version` (should be 18.18+)
- Check npm version: `npm --version` (should be 9+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Files not updating
- Clear browser cache
- Check web server cache settings
- Verify dist directory permissions: `chmod -R 755 dist`

### Git pull fails
- Check you're on the correct branch: `git branch`
- Check for uncommitted changes: `git status`
- If needed, stash changes: `git stash` then `git pull`
