import { browser } from "$app/environment";
import type { CacheStats, CachedChapter } from "$lib/types";
import {
  saveCachedChapter,
  getCachedChapter,
  getAllCachedChapters,
  deleteCachedChapter,
} from "$lib/db";

const IMAGE_CACHE_NAME = "mangadex-images";
const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Placeholder image for failed loads
 */
const PLACEHOLDER_URL =
  "data:image/svg+xml," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <rect fill="#1a1a2e" width="400" height="600"/>
  <text fill="#6366f1" font-family="Arial" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">
    Imagen no disponible
  </text>
</svg>
`);

/**
 * Cache Image Service
 * Manages caching of manga images using the Cache API with LRU eviction
 */
class CacheImageServiceClass {
  private lruOrder: Map<string, number> = new Map();
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    lastCleanup: Date.now(),
  };

  /**
   * Get the cache instance
   */
  private async getCache(): Promise<Cache | null> {
    if (!browser) return null;
    try {
      return await caches.open(IMAGE_CACHE_NAME);
    } catch (error) {
      console.error("Failed to open cache:", error);
      return null;
    }
  }

  /**
   * Update LRU order when an entry is accessed
   */
  private updateLRU(url: string): void {
    this.lruOrder.set(url, Date.now());
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private async evictIfNeeded(cache: Cache): Promise<void> {
    if (this.lruOrder.size >= MAX_CACHE_ENTRIES) {
      // Find the oldest entry
      let oldestUrl: string | null = null;
      let oldestTime = Date.now();

      for (const [url, time] of this.lruOrder) {
        if (time < oldestTime) {
          oldestTime = time;
          oldestUrl = url;
        }
      }

      if (oldestUrl) {
        try {
          await cache.delete(oldestUrl);
          this.lruOrder.delete(oldestUrl);
          this.stats.totalEntries--;
        } catch (error) {
          console.error("Failed to evict cache entry:", error);
        }
      }
    }
  }

  /**
   * Check if a cached response is stale
   */
  private async isStale(url: string, cache: Cache): Promise<boolean> {
    try {
      const response = await cache.match(url);
      if (!response) return true;

      const dateHeader = response.headers.get("date");
      if (!dateHeader) {
        // No date header, check our LRU timestamp
        const lruTime = this.lruOrder.get(url);
        if (lruTime && Date.now() - lruTime > CACHE_TTL_MS) {
          return true;
        }
      }

      return false;
    } catch {
      return true;
    }
  }

  /**
   * Get an image from cache or fetch it
   */
  async getImage(url: string): Promise<string> {
    if (!browser) return url;

    const cache = await this.getCache();
    if (!cache) {
      // No cache available, return URL directly
      this.stats.missCount++;
      return url;
    }

    try {
      // Check if we have a cached response
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        // Check if stale
        const stale = await this.isStale(url, cache);

        if (!stale) {
          // Cache hit!
          this.stats.hitCount++;
          this.updateLRU(url);
          this.stats.totalEntries = this.lruOrder.size;
          return url;
        }

        // Stale - try to fetch fresh in background
        this.fetchAndCache(url, true);
        return url;
      }

      // Cache miss - fetch and cache
      this.stats.missCount++;
      return await this.fetchAndCache(url, false);
    } catch (error) {
      console.error("Failed to get image:", error);
      return url;
    }
  }

  /**
   * Fetch and cache an image
   */
  private async fetchAndCache(
    url: string,
    isBackground: boolean,
  ): Promise<string> {
    const cache = await this.getCache();
    if (!cache) return url;

    try {
      const response = await fetch(url);

      if (response.ok) {
        // Clone response before putting in cache
        const responseToCache = response.clone();
        await cache.put(url, responseToCache);

        // Update LRU
        this.updateLRU(url);
        await this.evictIfNeeded(cache);

        this.stats.totalEntries = this.lruOrder.size;
      }

      return url;
    } catch (error) {
      if (!isBackground) {
        console.error("Failed to fetch and cache image:", error);
      }
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  async getImageWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await this.getImage(url);
      } catch (error) {
        lastError = error as Error;

        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAYS[attempt]),
          );
        }
      }
    }

    // All retries failed, return placeholder
    console.error("All retries exhausted for image:", url, lastError);
    return PLACEHOLDER_URL;
  }

  /**
   * Preload multiple images with rate limiting
   */
  async preloadImages(urls: string[]): Promise<void> {
    if (!browser || urls.length === 0) return;

    // Preload in batches to avoid overwhelming the network
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.all(
        batch.map((url) => this.getImageWithRetry(url).catch(() => {})),
      );

      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    if (!browser) return;

    try {
      await caches.delete(IMAGE_CACHE_NAME);
      this.lruOrder.clear();
      this.stats = {
        totalEntries: 0,
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      };
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  /**
   * Get all cached chapters
   */
  async getCachedChapters(): Promise<CachedChapter[]> {
    try {
      return await getAllCachedChapters();
    } catch (error) {
      console.error("Failed to get cached chapters:", error);
      return [];
    }
  }

  /**
   * Check if a chapter is cached
   */
  async isChapterCached(chapterId: string): Promise<boolean> {
    try {
      const chapter = await getCachedChapter(chapterId);
      return !!chapter;
    } catch {
      return false;
    }
  }

  /**
   * Mark a chapter as cached
   */
  async markChapterCached(
    chapterId: string,
    mangaId: string,
    pages: string[],
  ): Promise<void> {
    try {
      await saveCachedChapter({
        chapterId,
        mangaId,
        cachedAt: Date.now(),
        pages,
      });
    } catch (error) {
      console.error("Failed to mark chapter cached:", error);
    }
  }

  /**
   * Remove a chapter from cache
   */
  async removeChapterFromCache(chapterId: string): Promise<void> {
    try {
      await deleteCachedChapter(chapterId);
    } catch (error) {
      console.error("Failed to remove chapter from cache:", error);
    }
  }
}

/**
 * Singleton instance of CacheImageService
 */
export const cacheImageService = new CacheImageServiceClass();
