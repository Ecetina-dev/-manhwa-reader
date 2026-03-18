# 🚀 API Reference

Complete reference for Web Manhau APIs and data models.

## Table of Contents

1. [Authentication](#authentication)
2. [Series API](#series-api)
3. [Chapters API](#chapters-api)
4. [Ratings API](#ratings-api)
5. [Favorites API](#favorites-api)
6. [User API](#user-api)
7. [Data Models](#data-models)

---

## Authentication

### Login

**Service**: `src/lib/services/auth.ts`

```typescript
export async function login(email: string, password: string): Promise<AuthToken>;
```

**Response**:

```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Logout

```typescript
export async function logout(): Promise<void>;
```

Clears local auth state and notifies server.

---

## Series API

### Get All Series

**Service**: `src/lib/services/series.ts`

```typescript
export async function getSeries(options?: { page?: number; limit?: number; search?: string; sort?: "latest" | "popular" | "rating" }): Promise<SeriesList>;
```

**Response**:

```json
{
  "items": [
    {
      "id": "series-123",
      "title": "Solo Leveling",
      "slug": "solo-leveling",
      "description": "...",
      "coverUrl": "...",
      "status": "ongoing",
      "rating": 4.8,
      "chapters": 180,
      "lastUpdate": "2024-03-17",
      "genres": ["action", "fantasy"]
    }
  ],
  "total": 1500,
  "page": 1,
  "limit": 20
}
```

### Get Series Details

```typescript
export async function getSeriesById(id: string): Promise<Series>;
```

Returns complete series information including all chapters.

### Search Series

```typescript
export async function searchSeries(query: string): Promise<Series[]>;
```

Full-text search on title and description.

---

## Chapters API

### Get Chapters for Series

**Service**: `src/lib/services/chapters.ts`

```typescript
export async function getChapters(seriesId: string): Promise<Chapter[]>;
```

**Response**:

```json
[
  {
    "id": "ch-456",
    "seriesId": "series-123",
    "number": 1,
    "title": "Chapter 1: Beginning",
    "releaseDate": "2024-01-01",
    "pages": 45,
    "content": "..."
  }
]
```

### Get Chapter Content

```typescript
export async function getChapter(id: string): Promise<ChapterContent>;
```

**Response**:

```json
{
  "id": "ch-456",
  "title": "Chapter 1: Beginning",
  "pages": [
    {
      "number": 1,
      "imageUrl": "https://cdn.example.com/ch-456-page-1.webp",
      "alt": "Page 1 description"
    }
  ],
  "nextChapter": "ch-457",
  "previousChapter": null
}
```

### Mark Chapter as Read

```typescript
export async function markChapterRead(chapterId: string, progress?: number): Promise<ReadingProgress>;
```

**Parameters**:

- `chapterId`: Chapter ID
- `progress`: Reading progress 0-100 (optional)

---

## Ratings API

### Get Series Rating

**Service**: `src/lib/services/ratings.ts`

```typescript
export async function getSeriesRating(seriesId: string): Promise<Rating>;
```

**Response**:

```json
{
  "seriesId": "series-123",
  "averageRating": 4.8,
  "totalRatings": 12500,
  "distribution": {
    "5": 8000,
    "4": 3000,
    "3": 1200,
    "2": 200,
    "1": 100
  },
  "userRating": 5
}
```

### Submit Rating

```typescript
export async function submitRating(seriesId: string, rating: number, review?: string): Promise<RatingResult>;
```

**Parameters**:

- `seriesId`: Series to rate
- `rating`: 1-5 star rating
- `review`: Optional text review

---

## Favorites API

### Get User Favorites

**Service**: `src/lib/services/favorites.ts`

```typescript
export async function getFavorites(): Promise<Favorite[]>;
```

**Response**:

```json
[
  {
    "id": "fav-789",
    "seriesId": "series-123",
    "series": {
      "title": "Solo Leveling",
      "coverUrl": "..."
    },
    "addedAt": "2024-01-15",
    "notes": "Amazing story!"
  }
]
```

### Add to Favorites

```typescript
export async function addFavorite(seriesId: string, notes?: string): Promise<Favorite>;
```

### Remove from Favorites

```typescript
export async function removeFavorite(favoriteId: string): Promise<void>;
```

---

## User API

### Get User Profile

**Service**: `src/lib/services/user.ts`

```typescript
export async function getUserProfile(): Promise<User>;
```

**Response**:

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "createdAt": "2023-01-01",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "notifications": true
  }
}
```

### Update User Profile

```typescript
export async function updateUserProfile(updates: Partial<User>): Promise<User>;
```

### Get Reading History

```typescript
export async function getReadingHistory(limit?: number): Promise<ReadingHistory[]>;
```

**Response**:

```json
[
  {
    "id": "rh-789",
    "seriesId": "series-123",
    "seriesTitle": "Solo Leveling",
    "chapterId": "ch-456",
    "chapterNumber": 1,
    "readAt": "2024-03-17T10:30:00Z",
    "progress": 100
  }
]
```

---

## Data Models

### Series

```typescript
interface Series {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  rating: number;
  chapters: number;
  lastUpdate: Date;
  genres: string[];
  author: string;
  artist?: string;
  language: string;
}
```

### Chapter

```typescript
interface Chapter {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  releaseDate: Date;
  pages: number;
  content: string;
  uploader: string;
}
```

### ChapterContent

```typescript
interface ChapterContent {
  id: string;
  title: string;
  pages: ChapterPage[];
  nextChapter: string | null;
  previousChapter: string | null;
}

interface ChapterPage {
  number: number;
  imageUrl: string;
  alt: string;
}
```

### Rating

```typescript
interface Rating {
  seriesId: string;
  averageRating: number;
  totalRatings: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  userRating?: number;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: boolean;
  };
}
```

### Favorite

```typescript
interface Favorite {
  id: string;
  seriesId: string;
  series: SeriesPreview;
  addedAt: Date;
  notes?: string;
}

interface SeriesPreview {
  id: string;
  title: string;
  coverUrl: string;
  rating: number;
}
```

### ReadingHistory

```typescript
interface ReadingHistory {
  id: string;
  seriesId: string;
  seriesTitle: string;
  chapterId: string;
  chapterNumber: number;
  readAt: Date;
  progress: number; // 0-100
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "SERIES_NOT_FOUND",
    "message": "The requested series does not exist",
    "statusCode": 404
  }
}
```

### Common Error Codes

| Code                  | HTTP | Description           |
| --------------------- | ---- | --------------------- |
| `INVALID_CREDENTIALS` | 401  | Login failed          |
| `UNAUTHORIZED`        | 403  | No access permission  |
| `SERIES_NOT_FOUND`    | 404  | Series doesn't exist  |
| `CHAPTER_NOT_FOUND`   | 404  | Chapter doesn't exist |
| `DUPLICATE_FAVORITE`  | 409  | Already in favorites  |
| `RATE_LIMITED`        | 429  | Too many requests     |
| `INTERNAL_ERROR`      | 500  | Server error          |

---

## Rate Limiting

- **Unauthenticated**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Search**: 50 requests/hour

Headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Caching

### Browser Cache

- Series list: 1 hour
- Series details: 24 hours
- Chapter content: Until user logout
- User profile: 1 hour

### Service Worker Cache

- Assets: Cache first, update in background
- API calls: Stale-while-revalidate

---

For implementation details, see [ARCHITECTURE.md](./ARCHITECTURE.md)
