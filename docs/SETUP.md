# 📚 Setup Guide

Complete guide for setting up Web Manhau for local development.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or pnpm/yarn)
- **Git**: For cloning the repository
- **SQLite3**: Usually comes with Node.js via better-sqlite3

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/web_manhau.git
cd web_manhau
```

### 2. Install Dependencies

```bash
npm install
```

Or with pnpm:

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your configuration:

```env
# Database
PUBLIC_DB_PATH=./data/manhau.db

# API
PUBLIC_API_TIMEOUT=5000

# Features
PUBLIC_ENABLE_ANALYTICS=false     # Disable for local dev
PUBLIC_ENABLE_OFFLINE_MODE=true
PUBLIC_DEBUG=true                 # Enable debug logs
```

### 4. Create Database

```bash
mkdir -p ./data
```

The database will be created automatically on first run.

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

## Development Workflow

### Running Different Commands

| Command              | Purpose                          |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start dev server with hot reload |
| `npm run check`      | Type-check code                  |
| `npm run test`       | Run unit tests                   |
| `npm run test:watch` | Run tests in watch mode          |
| `npm run test:e2e`   | Run E2E tests                    |
| `npm run lint`       | Check code quality               |
| `npm run format`     | Auto-format code                 |

### Before Committing

Always run these to ensure code quality:

```bash
# Type checking
npm run check

# Formatting
npm run format

# Linting
npm run lint

# Tests
npm test
npm run test:e2e
```

Or use the all-in-one check:

```bash
npm run fix  # Runs build + format + lint
```

## Database Development

### SQLite with better-sqlite3

The app uses SQLite for local data storage.

#### View Database

```bash
# Using sqlite3 CLI
sqlite3 ./data/manhau.db

# Common commands:
sqlite> .tables          # List tables
sqlite> .schema TABLE    # Show table structure
sqlite> SELECT * FROM chapters LIMIT 5;  # Query data
sqlite> .quit            # Exit
```

Or use a GUI:

- **DB Browser for SQLite**: [sqlitebrowser.org](https://sqlitebrowser.org/)
- **VS Code Extension**: "SQLite" by alexcvzz

### Database Migrations

If you make schema changes:

```bash
# Create migration
npm run db:migration create add_new_column

# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback
```

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With UI dashboard
npm run test:ui

# For a specific file
npm test -- src/lib/services/chapters.test.ts

# With coverage
npm test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Watch mode
npm run test:e2e:ui

# Specific test file
npx playwright test tests/e2e/reading.spec.ts

# Debug mode (open inspector)
npx playwright test --debug

# Headed mode (show browser)
npx playwright test --headed
```

### Writing Tests

#### Unit Test Example

```typescript
// src/lib/services/__tests__/chapters.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { getChapters, markChapterRead } from "../chapters";

describe("Chapter Service", () => {
  beforeEach(() => {
    // Setup before each test
  });

  it("should fetch chapters for a series", async () => {
    const chapters = await getChapters("series-1");
    expect(chapters).toHaveLength(5);
    expect(chapters[0]).toHaveProperty("title");
  });

  it("should mark chapter as read", async () => {
    await markChapterRead("chapter-1");
    // Assert the change
  });
});
```

#### E2E Test Example

```typescript
// tests/e2e/reading.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Reading Chapter", () => {
  test("should display chapter content", async ({ page }) => {
    await page.goto("/chapters/ch-123");

    const title = await page.locator("h1").textContent();
    expect(title).toContain("Chapter");

    const pages = await page.locator("img.chapter-page");
    expect(await pages.count()).toBeGreaterThan(0);
  });

  it("should save reading progress", async ({ page }) => {
    await page.goto("/chapters/ch-123");
    await page.evaluate(() => window.scrollBy(0, 500));

    // Verify progress was saved
    const progress = await page.evaluate(() => localStorage.getItem("reading-progress-ch-123"));
    expect(progress).not.toBeNull();
  });
});
```

## IDE Setup

### VS Code

Install recommended extensions:

```
code --install-extension svelte.svelte-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension mkhl.direnv
```

`.vscode/settings.json` is pre-configured.

### Launch Configuration

Debug in VS Code:

1. Open `.vscode/launch.json` (pre-configured)
2. Press `F5` or `Ctrl+Shift+D`
3. Select "Launch Chrome"

## Browser DevTools

### Svelte DevTools

[Browser extension](https://github.com/sveltejs/svelte-devtools) to inspect components and stores.

### Service Worker Debugging

Open DevTools:

1. Press `F12`
2. Go to **Application** tab
3. Check **Service Workers** section
4. Inspect **Cache Storage** and **IndexedDB**

## Troubleshooting

### Port Already in Use

If port 5173 is in use:

```bash
npm run dev -- --port 3000
```

### Database Lock Error

```
Error: database is locked
```

Close the database connection or use SQLite CLI:

```bash
# Kill any open connections
rm ./data/manhau.db-wal ./data/manhau.db-shm
```

### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Fails

```bash
npm run check        # Find type errors
npm run format      # Auto-format
npm run lint --fix  # Fix lint issues
```

### Service Worker Not Updating

```javascript
// In DevTools console
navigator.serviceWorker.getRegistrations().then((regs) => {
  regs.forEach((reg) => reg.unregister());
});
```

Then refresh the page.

## Performance Tips

### Enable Source Maps in Dev

```bash
# Already enabled in vite.config.ts
# No action needed
```

### Monitor Bundle Size

```bash
npm run build -- --stats json
```

Then analyze with [rollup-plugin-visualizer](https://www.npmjs.com/package/rollup-plugin-visualizer)

### Database Query Optimization

Check slow queries:

```typescript
// Enable timing in better-sqlite3
const db = new Database("./data/manhau.db");
db.pragma("journal_mode = WAL"); // Write-Ahead Logging
```

## Deployment Preparation

### Local Production Build

```bash
npm run build
npm run preview
```

Open http://localhost:5173 to test the production build locally.

### Pre-deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] No type errors: `npm run check`
- [ ] No lint errors: `npm run lint`
- [ ] Builds successfully: `npm run build`
- [ ] Environment variables set correctly
- [ ] Database migrations up to date
- [ ] Service Worker caching strategy verified

## Environment Variables

### Development

```env
NODE_ENV=development
PUBLIC_DEBUG=true
PUBLIC_ENABLE_ANALYTICS=false
PUBLIC_DB_PATH=./data/test.db
```

### Production

```env
NODE_ENV=production
PUBLIC_DEBUG=false
PUBLIC_ENABLE_ANALYTICS=true
PUBLIC_DB_PATH=/data/prod.db
```

## Further Reading

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Vite Docs](https://vitejs.dev/)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [SQLite Docs](https://www.sqlite.org/docs.html)

---

**Need help?** Open an [issue](https://github.com/your-username/web_manhau/issues) or check [discussions](https://github.com/your-username/web_manhau/discussions).
