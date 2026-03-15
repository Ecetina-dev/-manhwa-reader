export interface MangaDexManga {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    description?: Record<string, string>;
    status: string;
    year?: number;
    tags: Array<{
      id: string;
      attributes: {
        name: Record<string, string>;
        group: string;
      };
    }>;
    coverFileName?: string;
  };
  relationships: Array<{
    id: string;
    type: string;
    attributes?: {
      fileName?: string;
      name?: string;
    };
  }>;
}

export interface MangaDexChapter {
  id: string;
  attributes: {
    chapter?: string;
    title?: string;
    volume?: string;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

export interface MangaDexPage {
  url: string;
  width: number;
  height: number;
}

export interface Serie {
  id: string;
  title: string;
  cover: string;
  description: string;
  status: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: string;
  title: string;
  pages: number;
  publishAt: string;
}

export interface ReadingProgress {
  serieId: string;
  chapterId: string;
  page: number;
  updatedAt: number;
}

// ============================================
// PWA Offline Foundation - New Types
// ============================================

/**
 * Represents a cache entry for tracking cached resources
 */
export interface CacheEntry {
  url: string;
  timestamp: number;
  size: number;
  lastAccessed: number;
}

/**
 * Represents the offline status of the application
 */
export interface OfflineStatus {
  isOnline: boolean;
  lastOnline: number | null;
  cachedChapters: string[];
}

/**
 * Statistics about the image cache
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  lastCleanup: number;
}

/**
 * Represents a cached chapter for offline reading
 */
export interface CachedChapter {
  chapterId: string;
  mangaId: string;
  cachedAt: number;
  pages: string[];
}

/**
 * Reading progress stored in IndexedDB
 */
export interface StoredReadingProgress {
  serieId: string;
  chapterId: string;
  page: number;
  updatedAt: number;
}

/**
 * Database schema for IndexedDB
 */
export interface DBSchema {
  'reading-progress': {
    key: string;
    value: StoredReadingProgress;
  };
  'cached-chapters': {
    key: string;
    value: CachedChapter;
  };
}
