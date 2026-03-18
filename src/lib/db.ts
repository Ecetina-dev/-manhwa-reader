import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { browser } from "$app/environment";
import type { StoredReadingProgress, CachedChapter } from "./types";

const DB_NAME = "manhwa-reader";
const DB_VERSION = 1;

/**
 * IndexedDB Database interface
 */
interface ManhwaReaderDB extends DBSchema {
  "reading-progress": {
    key: string;
    value: StoredReadingProgress;
  };
  "cached-chapters": {
    key: string;
    value: CachedChapter;
  };
}

/**
 * Fallback to localStorage if IndexedDB is not available
 */
const LOCAL_STORAGE_KEY = "manhwa-reader-fallback";

/**
 * Opens the IndexedDB database
 */
export async function openManhwaDB(): Promise<IDBPDatabase<ManhwaReaderDB> | null> {
  if (!browser) return null;

  try {
    return await openDB<ManhwaReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create reading-progress store
        if (!db.objectStoreNames.contains("reading-progress")) {
          db.createObjectStore("reading-progress", { keyPath: "serieId" });
        }

        // Create cached-chapters store
        if (!db.objectStoreNames.contains("cached-chapters")) {
          db.createObjectStore("cached-chapters", { keyPath: "chapterId" });
        }
      },
    });
  } catch (error) {
    console.warn("IndexedDB unavailable, falling back to localStorage:", error);
    return null;
  }
}

/**
 * Save reading progress to IndexedDB
 */
export async function saveProgress(
  serieId: string,
  chapterId: string,
  page: number,
): Promise<void> {
  const db = await openManhwaDB();

  if (db) {
    await db.put("reading-progress", {
      serieId,
      chapterId,
      page,
      updatedAt: Date.now(),
    });
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const progress: Record<string, StoredReadingProgress> = stored
      ? JSON.parse(stored)
      : {};
    progress[serieId] = { serieId, chapterId, page, updatedAt: Date.now() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  }
}

/**
 * Get reading progress for a serie
 */
export async function getProgress(
  serieId: string,
): Promise<StoredReadingProgress | undefined> {
  const db = await openManhwaDB();

  if (db) {
    return db.get("reading-progress", serieId);
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const progress: Record<string, StoredReadingProgress> = stored
      ? JSON.parse(stored)
      : {};
    return progress[serieId];
  }
}

/**
 * Get all reading progress
 */
export async function getAllProgress(): Promise<StoredReadingProgress[]> {
  const db = await openManhwaDB();

  if (db) {
    return db.getAll("reading-progress");
  } else {
    // Fallback to localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const progress: Record<string, StoredReadingProgress> = stored
      ? JSON.parse(stored)
      : {};
    return Object.values(progress);
  }
}

/**
 * Save a cached chapter
 */
export async function saveCachedChapter(chapter: CachedChapter): Promise<void> {
  const db = await openManhwaDB();

  if (db) {
    await db.put("cached-chapters", chapter);
  }
  // No localStorage fallback for cached chapters (too much data)
}

/**
 * Get a cached chapter by ID
 */
export async function getCachedChapter(
  chapterId: string,
): Promise<CachedChapter | undefined> {
  const db = await openManhwaDB();

  if (db) {
    return db.get("cached-chapters", chapterId);
  }
  return undefined;
}

/**
 * Get all cached chapters
 */
export async function getAllCachedChapters(): Promise<CachedChapter[]> {
  const db = await openManhwaDB();

  if (db) {
    return db.getAll("cached-chapters");
  }
  return [];
}

/**
 * Delete a cached chapter
 */
export async function deleteCachedChapter(chapterId: string): Promise<void> {
  const db = await openManhwaDB();

  if (db) {
    await db.delete("cached-chapters", chapterId);
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  if (!browser) return false;

  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return true;

  try {
    const progress: Record<string, StoredReadingProgress> = JSON.parse(stored);
    const db = await openManhwaDB();

    if (db) {
      const tx = db.transaction("reading-progress", "readwrite");
      const store = tx.objectStore("reading-progress");

      for (const item of Object.values(progress)) {
        await store.put(item);
      }

      await tx.done;

      // Clear localStorage after successful migration
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log("Migration from localStorage to IndexedDB completed");
      return true;
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }

  return false;
}

/**
 * Clear all reading progress
 */
export async function clearAllProgress(): Promise<void> {
  const db = await openManhwaDB();

  if (db) {
    await db.clear("reading-progress");
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}
