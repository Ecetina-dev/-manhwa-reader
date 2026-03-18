# 🏗️ Architecture Overview

Web Manhau follows a **layered architecture** with clear separation of concerns.

## System Architecture

```
┌─────────────────────────────────────────────┐
│          User Interface Layer               │
│  (Svelte Components, Routes, Pages)         │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│     Application/Business Logic Layer        │
│  (Services, Stores, State Management)       │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│        Data Access Layer                    │
│  (Database, APIs, Cache, Storage)           │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── chapters/        # Chapter-related components
│   │   ├── series/          # Series/Manhwa components
│   │   ├── common/          # Shared UI (buttons, modals, etc.)
│   │   └── layout/          # Layout components (header, nav, etc.)
│   │
│   ├── services/            # Business logic services
│   │   ├── auth.ts          # Authentication
│   │   ├── chapters.ts      # Chapter management
│   │   ├── series.ts        # Series management
│   │   ├── sync.ts          # Cloud sync
│   │   ├── cache.ts         # Caching layer
│   │   └── offline.ts       # Offline mode
│   │
│   ├── stores/              # State management (Svelte stores)
│   │   ├── auth.ts          # Auth state
│   │   ├── reading.ts       # Reading progress
│   │   ├── favorites.ts     # Favorites state
│   │   └── ui.ts            # UI state (theme, modals, etc.)
│   │
│   ├── db/                  # Database layer
│   │   ├── schema.ts        # Database schema
│   │   ├── queries.ts       # SQL queries
│   │   └── migrations/      # Database migrations
│   │
│   ├── utils/               # Utility functions
│   │   ├── format.ts        # Formatting utilities
│   │   ├── date.ts          # Date utilities
│   │   └── validators.ts    # Input validation
│   │
│   └── types.ts             # TypeScript types & interfaces
│
├── routes/                  # SvelteKit file-based routing
│   ├── +layout.svelte       # Root layout
│   ├── +page.svelte         # Home page
│   ├── series/
│   │   ├── [slug]/          # Series detail page
│   │   └── +page.svelte     # Series list/search
│   │
│   ├── chapters/
│   │   └── [id]/            # Chapter reader
│   │
│   ├── settings/            # User settings
│   └── api/                 # API routes (if needed)
│
├── app.svelte               # Root component
└── app.css                  # Global styles

tests/
├── unit/                    # Unit tests (Vitest)
│   ├── services/
│   ├── stores/
│   └── utils/
│
└── e2e/                     # E2E tests (Playwright)
    ├── reading.spec.ts
    ├── favorites.spec.ts
    └── sync.spec.ts
```

## Key Patterns

### 1. **Service Layer**

Encapsulates business logic away from components.

```typescript
// src/lib/services/chapters.ts
export async function getChapters(seriesId: string) {
  const db = getDatabase();
  return db.query("SELECT * FROM chapters WHERE series_id = ?", [seriesId]);
}

export async function markChapterRead(chapterId: string) {
  const db = getDatabase();
  return db.query("UPDATE chapters SET read = 1 WHERE id = ?", [chapterId]);
}
```

Components call services, not databases:

```svelte
<script>
  import { getChapters } from '$lib/services/chapters';

  let chapters = [];

  onMount(async () => {
    chapters = await getChapters(seriesId);
  });
</script>
```

### 2. **Svelte Stores for State**

Centralized state management for reactive data.

```typescript
// src/lib/stores/reading.ts
import { writable } from "svelte/store";

export const currentChapter = writable<Chapter | null>(null);
export const readingProgress = writable<ReadingProgress>({});

export async function loadChapter(id: string) {
  const chapter = await getChapter(id);
  currentChapter.set(chapter);
}
```

Usage in components:

```svelte
<script>
  import { currentChapter, readingProgress } from '$lib/stores/reading';
</script>

<h1>{$currentChapter?.title}</h1>
<p>Progress: {$readingProgress[currentChapterId]}%</p>
```

### 3. **Database-First Data Flow**

1. **Database** is the source of truth
2. **Services** query and mutate the database
3. **Stores** expose services reactively
4. **Components** consume stores

```
Database ← Services → Stores → Components
```

### 4. **Type Safety with TypeScript**

All functions are fully typed:

```typescript
interface Chapter {
  id: string;
  title: string;
  seriesId: string;
  number: number;
  content: string;
  pages: string[];
  readAt?: Date;
}

interface ReadingProgress {
  [chapterId: string]: number; // 0-100
}
```

## Data Flow

### Reading a Chapter

1. **Component** calls `loadChapter(id)`
2. **Store** calls `getChapter(id)` from service
3. **Service** queries SQLite database
4. **Database** returns chapter data
5. **Store** updates reactive state
6. **Component** re-renders with new data

```
Component → Store → Service → Database
    ↑────────────────────────────────│
```

### Syncing Favorites (Offline → Cloud)

1. **Component** calls `addFavorite(series)`
2. **Service** updates local SQLite
3. **Store** updates state immediately
4. **Sync Service** detects change
5. **Sync Service** sends to cloud when online
6. **Cloud** returns confirmation
7. **Sync Service** marks as synced in DB

```
Local DB → Sync Service → Cloud API
```

## Performance Considerations

### 1. **Lazy Loading**

Routes and components are code-split automatically:

```typescript
import { goto } from "$app/navigation";
// Code is split and loaded on demand
```

### 2. **Image Optimization**

Use `<picture>` or webp with fallbacks:

```svelte
<picture>
  <source srcset={img} type="image/webp" />
  <img src={img} alt="Page" loading="lazy" />
</picture>
```

### 3. **Database Indexing**

Frequently queried columns are indexed:

```typescript
CREATE INDEX idx_chapters_series_id ON chapters(series_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
```

### 4. **Caching Strategy**

- **Browser Cache**: Service Worker caches assets
- **IndexedDB**: Cache full-text search indexes
- **In-Memory Cache**: Services cache frequently accessed data

## Offline Mode

### Service Worker Strategy

1. **Assets**: Cache-first (CSS, JS, images)
2. **API**: Stale-while-revalidate
3. **Database**: Local-first (IndexedDB + SQLite)

### Sync Queue

Offline changes are queued and synced when online:

```
┌──────────────┐
│  User Action │
└──────┬───────┘
       │
    ┌──▼──┐
    │ Out │  Save to local DB
    │line?│  Add to sync queue
    └─────┘
       │
    ┌──▼──┐
    │Back │  Send sync queue to server
    │Onln?│  Merge conflicts if needed
    └─────┘
```

## Security

### Authentication

- JWT tokens stored in httpOnly cookies
- Refresh tokens rotated on each use
- CSRF protection via SameSite cookies

### Data

- User data is encrypted at rest in SQLite
- API communication is HTTPS only
- Sensitive data (passwords) never stored locally

## Testing Strategy

### Unit Tests

- Services: Mocked database
- Stores: Test state updates
- Utilities: Pure function tests

### E2E Tests

- Critical user flows (reading, favoriting)
- Offline functionality
- Sync behavior
- Multi-device sync

### Test Coverage Goals

- **Services**: >90%
- **Components**: >70%
- **Overall**: >80%

## Deployment Architecture

### Development

```
SvelteKit Dev Server (Vite)
    ↓
    Local SQLite
    ↓
    Browser (with Service Worker)
```

### Production

```
Cloudflare Pages
    ↓
    API (serverless functions or backend)
    ↓
    PostgreSQL / Cloud Database
    ↓
    Browser (with Service Worker)
```

---

For detailed setup instructions, see [SETUP.md](./SETUP.md)
