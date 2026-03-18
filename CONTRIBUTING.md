# 🤝 Contributing to Web Manhau

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 📋 Code of Conduct

Be respectful, inclusive, and professional. We're building this together.

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/web_manhau.git`
3. **Create a branch** from `main`
4. **Make your changes**
5. **Push** and **create a Pull Request**

## 🌿 Branch Naming Convention

Use the following prefixes:

| Prefix      | Purpose                  | Example                       |
| ----------- | ------------------------ | ----------------------------- |
| `feat/`     | New feature              | `feat/offline-sync`           |
| `fix/`      | Bug fix                  | `fix/reading-history-bug`     |
| `docs/`     | Documentation            | `docs/api-reference`          |
| `refactor/` | Code refactoring         | `refactor/store-architecture` |
| `perf/`     | Performance improvements | `perf/image-loading`          |
| `test/`     | Tests                    | `test/add-e2e-tests`          |
| `chore/`    | Maintenance              | `chore/update-deps`           |
| `ci/`       | CI/CD                    | `ci/github-actions-setup`     |

## 📝 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Format Rules

- **type**: feat, fix, docs, style, refactor, perf, test, chore, ci, revert
- **scope**: (optional) component, service, store, db, api, etc.
- **subject**:
  - Imperative mood ("add" not "adds" or "added")
  - Don't capitalize first letter
  - No period at the end
  - Max 50 characters
- **body**: (optional)
  - Explain WHAT and WHY, not HOW
  - Wrap at 72 characters
  - Separate from subject with blank line
- **footer**: (optional)
  - Reference issues: `Closes #123`
  - Breaking changes: `BREAKING CHANGE: description`

### Examples

```
feat(offline): add chapter download for offline reading

Allow users to download chapters for reading without internet connection.
Downloaded chapters are stored in IndexedDB with metadata.

Closes #45
```

```
fix(sync): prevent duplicate entries in favorites list

The sync service was creating duplicate entries when syncing from multiple devices.
Added unique constraint check before insertion.
```

```
docs: update deployment guide

Added CloudFlare Pages deployment instructions and environment setup details.
```

## 🔍 Pull Request Process

### Before Creating a PR

1. **Update your branch** with latest `main`

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks locally**

   ```bash
   npm run check       # Type checking
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests
   npm run lint        # Linting
   npm run format:check # Code formatting
   ```

3. **Fix any issues**
   ```bash
   npm run format      # Auto-format code
   npm run lint --fix  # Auto-fix lint issues
   ```

### PR Template

Use the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) when creating your PR.

**Required sections:**

- **Description**: What does this PR do?
- **Type**: feat, fix, docs, refactor, perf, test, chore, ci
- **Related Issues**: Link to issues this closes
- **Testing**: How did you test this?
- **Screenshots/Videos**: If UI changes
- **Checklist**:
  - [ ] Tests pass (`npm test`)
  - [ ] Type checking passes (`npm run check`)
  - [ ] Code is formatted (`npm run format`)
  - [ ] No console errors/warnings
  - [ ] Documentation updated (if needed)

## 🧪 Testing Requirements

### Unit Tests

- Write tests for new features
- Maintain >80% code coverage
- Use [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

```bash
npm run test        # Run tests once
npm run test:watch  # Watch mode
```

### E2E Tests

- Add E2E tests for critical user flows
- Use [Playwright](https://playwright.dev/)

```bash
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # Interactive UI
```

### Test File Naming

```
src/lib/services/__tests__/auth.test.ts
src/routes/login/__tests__/+page.svelte.test.ts
```

## 💅 Code Style

### TypeScript

- Use strict mode (`"strict": true` in tsconfig.json)
- Type all function parameters and returns
- No implicit `any`

### Svelte

- Use SvelteKit conventions
- One component per file
- Component names in PascalCase: `UserCard.svelte`
- Utility components in lowercase: `button.svelte`

### Formatting

- Use Prettier for formatting
- 2-space indentation
- Max line length: 100 characters

```bash
npm run format  # Auto-format your code
```

### Linting

- ESLint enforces code quality
- Fix issues with `npm run lint --fix`

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Explain the "why", not just the "what"

```typescript
/**
 * Syncs favorites across devices using IndexedDB
 * @param userId - User ID for sync identification
 * @param options - Sync configuration
 * @returns Promise<SyncResult> with conflict resolution status
 */
export async function syncFavorites(userId: string, options: SyncOptions) {
  // ...
}
```

### Update Documentation Files

If your PR changes functionality, update:

- `docs/ARCHITECTURE.md` - Architecture changes
- `docs/API.md` - API changes
- `README.md` - New user-facing features

## 🎯 Development Tips

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (watches for changes)
npm run dev

# Type-checking in background
npm run check:watch
```

### Debugging

- Browser DevTools: Open in browser developer tools
- VSCode Debugger: See [.vscode/launch.json](.vscode/launch.json)
- Vitest UI: `npm run test:ui`

### Database

- SQLite database at `./data/manhau.db`
- Migrations in `src/lib/db/migrations/`
- Run migrations: `npm run db:migrate`

## 🔄 Review Process

- At least 1 approval needed
- All checks must pass (tests, linting, type-checking)
- No unresolved conversations
- Merge with "Squash and merge" for clean history

## 🚢 Release Process

Releases follow [Semantic Versioning](https://semver.org/):

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes

## ❓ Questions?

- 💬 Open a [Discussion](https://github.com/your-username/web_manhau/discussions)
- 📧 Email: your.email@example.com
- 🐛 Found a bug? Open an [Issue](https://github.com/your-username/web_manhau/issues)

---

**Thank you for contributing! 🎉**
