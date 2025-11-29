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

**IMPORTANT**: The web server must serve files from the `/dist` directory, not from `public_html` directly.

### If using Apache

The `.htaccess` file is automatically included in the build and will be in the `dist` directory. It handles:
- Correct MIME types for JavaScript modules
- Client-side routing (SPA)
- Compression and caching

**Option 1: Change Document Root (Recommended)**
Configure your Apache virtual host to point to the `dist` directory:

```apache
<VirtualHost *:80>
    ServerName pixli-pro.jamescutts.me
    DocumentRoot /var/www/pixli-pro.jamescutts.me/public_html/dist
    
    <Directory /var/www/pixli-pro.jamescutts.me/public_html/dist>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Option 2: Copy dist contents to public_html root**
After each build, copy the dist contents:

```bash
cd /var/www/pixli-pro.jamescutts.me/public_html
rm -rf *.html *.js *.css assets logo .htaccess  # Remove old files (be careful!)
cp -r dist/* .
cp dist/.htaccess .  # Ensure .htaccess is in the root
```

### If using Nginx (Recommended for Hostinger VPS)

**IMPORTANT**: The `root` directive must point to the `/dist` directory, and MIME types must be explicitly set.

1. **Create or edit your Nginx configuration file:**

   ```bash
   # Edit the site configuration (adjust path as needed)
   sudo nano /etc/nginx/sites-available/pixli-pro.jamescutts.me
   # OR if using Hostinger's structure:
   sudo nano /etc/nginx/conf.d/pixli-pro.conf
   ```

2. **Use the configuration from `nginx.conf.example` in the project root:**

   The key settings are:
   - `root /var/www/pixli-pro.jamescutts.me/public_html/dist;` - Must point to dist directory
   - `types { application/javascript js mjs; }` - Critical for fixing MIME type errors
   - `try_files $uri $uri/ /index.html;` - Handles SPA routing

3. **Test and reload Nginx:**

   ```bash
   # Test configuration
   sudo nginx -t
   
   # If test passes, reload Nginx
   sudo systemctl reload nginx
   # OR
   sudo service nginx reload
   ```

4. **Verify the configuration:**

   ```bash
   # Check if Nginx is serving from the correct directory
   curl -I http://pixli-pro.jamescutts.me/assets/main-*.js | grep Content-Type
   # Should show: Content-Type: application/javascript
   ```

**Quick Nginx Config (Minimum Required):**

```nginx
server {
    listen 80;
    server_name pixli-pro.jamescutts.me;
    root /var/www/pixli-pro.jamescutts.me/public_html/dist;
    index index.html;

    # CRITICAL: Set correct MIME types for JavaScript modules
    types {
        application/javascript js mjs;
        text/css css;
        image/svg+xml svg;
    }

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

### "Stuck on loading 0%" or MIME type errors

**Symptoms:**
- Browser console shows: `Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "video/mp2t"` or similar
- Page stuck on "loading 0%"
- 404 errors for SVG files

**Solutions for Nginx:**

1. **Verify Nginx root points to dist directory:**
   ```bash
   # Check Nginx config
   sudo cat /etc/nginx/sites-available/pixli-pro.jamescutts.me | grep root
   # OR
   sudo cat /etc/nginx/conf.d/pixli-pro.conf | grep root
   # Should show: root /var/www/pixli-pro.jamescutts.me/public_html/dist;
   ```

2. **Verify MIME types are set in Nginx config:**
   ```bash
   sudo grep -A 5 "types {" /etc/nginx/sites-available/pixli-pro.jamescutts.me
   # Should include: application/javascript js mjs;
   ```

3. **Check file permissions:**
   ```bash
   chmod -R 755 /var/www/pixli-pro.jamescutts.me/public_html/dist
   chown -R www-data:www-data /var/www/pixli-pro.jamescutts.me/public_html/dist
   # OR if using nginx user:
   chown -R nginx:nginx /var/www/pixli-pro.jamescutts.me/public_html/dist
   ```

4. **Test and reload Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Test MIME types:**
   ```bash
   # Find a JS file in dist
   JS_FILE=$(ls /var/www/pixli-pro.jamescutts.me/public_html/dist/assets/*.js | head -1 | xargs basename)
   # Check what MIME type Nginx is serving
   curl -I http://pixli-pro.jamescutts.me/assets/$JS_FILE | grep Content-Type
   # Should show: Content-Type: application/javascript
   ```

6. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

**Solutions for Apache:**

1. **Verify web server is serving from dist directory:**
   ```bash
   ls -la /var/www/pixli-pro.jamescutts.me/public_html/dist
   ls -la /var/www/pixli-pro.jamescutts.me/public_html/dist/.htaccess
   ```

2. **Verify Apache is reading .htaccess:**
   - Check Apache config has `AllowOverride All` for the directory
   - Check Apache error logs: `tail -f /var/log/apache2/error.log`

3. **Rebuild and verify:**
   ```bash
   cd /var/www/pixli-pro.jamescutts.me/public_html
   npm run build:skip-check
   ls -la dist/.htaccess
   ```
