# Deployment Fix for Generated File Conflict

If you encounter this error during `git pull` on the server:

```
error: Your local changes to the following files would be overwritten by merge:
        src/constants/spriteCollections.generated.ts
```

## Solution

The file `src/constants/spriteCollections.generated.ts` is auto-generated and will be regenerated during the build process. Discard the local changes and pull again:

```bash
cd /var/www/pixli-pro.jamescutts.me/public_html
git checkout -- src/constants/spriteCollections.generated.ts
git pull origin main
npm install
npm run build
```

Or, if you want to stash all changes first:

```bash
cd /var/www/pixli-pro.jamescutts.me/public_html
git stash
git pull origin main
npm install
npm run build
```

The file will be automatically regenerated during `npm install` (via the `prebuild` hook) or when you run `npm run build`.

