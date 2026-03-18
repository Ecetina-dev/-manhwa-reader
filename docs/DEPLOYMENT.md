# 🚀 Deployment Guide

How to deploy Web Manhau to production.

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

**Pros**: Free tier, global CDN, unlimited bandwidth, fast builds

**Cons**: Serverless limitations, 30-second timeout

### Option 2: Vercel

**Pros**: Optimized for Next.js/Svelte, excellent DX

**Cons**: Premium pricing, vendor lock-in

### Option 3: Self-Hosted (Docker)

**Pros**: Full control, no vendor lock-in

**Cons**: Requires infrastructure management

---

## Cloudflare Pages Deployment

### 1. Connect Repository

```bash
# Push to GitHub
git push origin main
```

### 2. Create Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select **Pages**
3. Click **Create project → Connect to Git**
4. Authorize GitHub
5. Select **web_manhau** repository

### 3. Configure Build Settings

Set these in Cloudflare:

| Setting                    | Value                    |
| -------------------------- | ------------------------ |
| **Framework preset**       | SvelteKit                |
| **Build command**          | `npm run build`          |
| **Build output directory** | `.svelte-kit/cloudflare` |
| **Root directory**         | `/`                      |

### 4. Environment Variables

Add to Pages project settings:

```
NODE_ENV=production
PUBLIC_API_BASE_URL=https://api.example.com
PUBLIC_ENABLE_ANALYTICS=true
VITE_GA_MEASUREMENT_ID=G-XXXXX
```

### 5. Deploy

```bash
git push origin main
```

Cloudflare automatically builds and deploys. Done! 🎉

### 6. Custom Domain

In Pages settings:

1. Go to **Custom domains**
2. Add your domain (e.g., `manhau.com`)
3. Update DNS records pointing to Cloudflare

---

## Database for Production

### Option 1: Cloudflare D1 (SQLite in Cloudflare)

Best for Cloudflare Pages deployments.

```bash
# Install Wrangler
npm install -g wrangler

# Create D1 database
wrangler d1 create web-manhau

# Deploy schema
wrangler d1 execute web-manhau < migrations.sql

# Update wrangler.toml
[env.production]
d1_databases = ["DATABASE"]
```

### Option 2: Neon (PostgreSQL)

Better for larger applications.

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update services to use PostgreSQL

### Option 3: Supabase (PostgreSQL + Auth)

Full backend-as-a-service:

1. Create project at [supabase.com](https://supabase.com)
2. Configure authentication
3. Set up database
4. Update connection string

---

## Environment Configuration

### Production Variables (.env.production)

```env
# Database
DATABASE_URL=postgresql://...  # If using PostgreSQL
PUBLIC_DB_PATH=/persist/db/manhau.db  # If using SQLite

# API
PUBLIC_API_BASE_URL=https://api.example.com
PUBLIC_API_TIMEOUT=5000

# Features
PUBLIC_ENABLE_ANALYTICS=true
PUBLIC_ENABLE_OFFLINE_MODE=true
PUBLIC_DEBUG=false

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Deployment
NODE_ENV=production
```

### Using wrangler.toml (Cloudflare)

```toml
name = "web-manhau"
type = "javascript"
account_id = "your-account-id"
workers_dev = true
route = "example.com/*"
zone_id = "your-zone-id"

[env.production]
routes = [
  { pattern = "manhau.com/*", zone_name = "manhau.com" }
]

[env.production.vars]
NODE_ENV = "production"
PUBLIC_DEBUG = "false"

[[d1_databases]]
binding = "DB"
database_name = "web-manhau"
database_id = "your-db-id"
```

---

## Pre-Deployment Checklist

- [ ] All tests pass: `npm test && npm run test:e2e`
- [ ] No console errors: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrations up to date
- [ ] Service Worker caching strategy verified
- [ ] Security headers configured
- [ ] API rate limiting configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Google Analytics) configured
- [ ] SSL certificate valid
- [ ] Backup strategy in place

---

## CI/CD Pipeline

### GitHub Actions Workflow

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: web-manhau
          directory: build
```

### Setup GitHub Secrets

```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=xxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxx

# Database (if using external DB)
DATABASE_URL=postgresql://...

# Analytics
VITE_GA_MEASUREMENT_ID=G-xxxxx

# Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Performance Optimization

### 1. Asset Compression

Enable in Cloudflare:

- **Speed → Optimization → Auto Minify**: CSS, JS, HTML
- **Speed → Optimization → Brotli**: Enable

### 2. Caching Headers

```typescript
// src/routes/+server.ts
export async function handle({ event, resolve }) {
  const response = await resolve(event);

  // Cache static assets for 1 year
  if (event.url.pathname.startsWith("/_app/")) {
    response.headers.set("cache-control", "public, max-age=31536000, immutable");
  }

  // Cache pages for 1 hour
  response.headers.set("cache-control", "public, max-age=3600, s-maxage=3600");

  return response;
}
```

### 3. Image Optimization

Use WebP with fallbacks:

```svelte
<picture>
  <source srcset={cover} type="image/webp" />
  <img src={cover} alt="Series cover" width="300" height="400" />
</picture>
```

### 4. Database Indexing

Ensure production database has proper indexes:

```sql
CREATE INDEX idx_chapters_series ON chapters(series_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_ratings_series ON ratings(series_id);
```

---

## Monitoring & Logging

### Cloudflare Analytics

Available in Cloudflare Dashboard:

- Request counts
- Bandwidth usage
- Error rates
- Performance metrics

### Sentry Setup (Error Tracking)

```typescript
// src/hooks.client.ts
import * as Sentry from "@sentry/svelte";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Google Analytics 4

```typescript
// src/lib/analytics.ts
export function trackPageView(path: string) {
  if (typeof gtag !== "undefined") {
    gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
}
```

---

## Rollback Strategy

If deployment fails:

```bash
# Cloudflare Pages auto-saves previous builds
# Revert in Cloudflare Dashboard:
# Pages → web-manhau → Deployments → Select previous build
```

Or manually:

```bash
git revert HEAD
git push origin main
# Cloudflare rebuilds automatically
```

---

## Security Best Practices

### 1. HTTPS

- Automatic with Cloudflare
- Custom domain: Add SSL certificate

### 2. Security Headers

Cloudflare settings:

- **Security Level**: Medium
- **Always use HTTPS**: On
- **Automatic HTTPS Rewrites**: On

Add custom headers:

```typescript
// src/hooks.server.ts
export async function handle({ event, resolve }) {
  const response = await resolve(event);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
```

### 3. API Security

- Use HTTPS only
- Implement rate limiting
- Validate all inputs
- Use CORS appropriately

---

## Troubleshooting

### Build Fails on Cloudflare

```
Error: Build failed
```

Check:

- Node version matches (18+)
- `npm run build` succeeds locally
- `.wrangler` folder is in `.gitignore`
- Environment variables are set

### Database Connection Fails

```
Error: ENOENT: no such file or directory
```

For Cloudflare D1:

- Ensure database exists: `wrangler d1 list`
- Migrations applied: `wrangler d1 execute web-manhau < migrations.sql`

### Service Worker Issues

```
Service Worker failed to register
```

Check:

- `/service-worker.js` exists in `static/`
- PWA manifest valid
- HTTPS enabled

---

## Further Reading

- [SvelteKit Adapters](https://kit.svelte.dev/docs/adapters)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Google Analytics 4](https://support.google.com/analytics/answer/10089681)

---

For local development, see [SETUP.md](./SETUP.md)
