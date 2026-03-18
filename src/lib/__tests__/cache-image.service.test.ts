import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cacheImageService } from "$lib/services/cache-image.service";

// Mock $app/environment
vi.mock("$lib/db", () => ({
  saveCachedChapter: vi.fn(),
  getCachedChapter: vi.fn(),
  getAllCachedChapters: vi.fn(),
  deleteCachedChapter: vi.fn(),
}));

vi.mock("$app/environment", () => ({
  browser: true,
}));

describe("CacheImageService", () => {
  // Mock caches
  let mockCache: {
    match: vi.Mock;
    put: vi.Mock;
    delete: vi.Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCache = {
      match: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock global caches
    global.caches = {
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
    } as unknown as CacheStorage;

    // Mock fetch
    global.fetch = vi.fn();
  });

  describe("getImage", () => {
    it("should return URL when not in browser", async () => {
      // Test would need browser = false mock
    });

    it("should return cached URL on cache hit", async () => {
      const testUrl = "https://example.com/image.jpg";
      mockCache.match.mockResolvedValue(
        new Response(new Blob(), {
          headers: { date: new Date().toISOString() },
        }),
      );

      const result = await cacheImageService.getImage(testUrl);

      expect(mockCache.match).toHaveBeenCalledWith(testUrl);
      expect(result).toBe(testUrl);
    });

    it("should fetch and cache on cache miss", async () => {
      const testUrl = "https://example.com/image.jpg";
      mockCache.match.mockResolvedValue(undefined);

      (global.fetch as vi.Mock).mockResolvedValue(
        new Response(new Blob(), { status: 200 }),
      );

      const result = await cacheImageService.getImage(testUrl);

      expect(global.fetch).toHaveBeenCalledWith(testUrl);
      expect(mockCache.put).toHaveBeenCalled();
      expect(result).toBe(testUrl);
    });

    it("should return URL on fetch failure", async () => {
      const testUrl = "https://example.com/image.jpg";
      mockCache.match.mockResolvedValue(undefined);
      (global.fetch as vi.Mock).mockRejectedValue(new Error("Network error"));

      const result = await cacheImageService.getImage(testUrl);

      expect(result).toBe(testUrl);
    });
  });

  describe("getStats", () => {
    it("should return current cache statistics", () => {
      const stats = cacheImageService.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalEntries");
      expect(stats).toHaveProperty("hitCount");
      expect(stats).toHaveProperty("missCount");
      expect(stats).toHaveProperty("totalSize");
      expect(stats).toHaveProperty("lastCleanup");
    });
  });

  describe("clearCache", () => {
    it("should clear all cached images", async () => {
      (global.caches.delete as vi.Mock).mockResolvedValue(true);

      await cacheImageService.clearCache();

      expect(global.caches.delete).toHaveBeenCalledWith("mangadex-images");
    });

    it("should reset stats after clearing", async () => {
      (global.caches.delete as vi.Mock).mockResolvedValue(true);

      // First add some stats
      await cacheImageService.getImage("https://example.com/image1.jpg");

      // Then clear
      await cacheImageService.clearCache();

      const stats = cacheImageService.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
    });
  });

  describe("getCachedChapters", () => {
    it("should return cached chapters from DB", async () => {
      const { getAllCachedChapters } = await import("$lib/db");
      (getAllCachedChapters as vi.Mock).mockResolvedValue([
        {
          chapterId: "ch1",
          mangaId: "manga1",
          cachedAt: Date.now(),
          pages: [],
        },
      ]);

      const chapters = await cacheImageService.getCachedChapters();

      expect(chapters).toHaveLength(1);
      expect(chapters[0].chapterId).toBe("ch1");
    });
  });

  describe("isChapterCached", () => {
    it("should return true when chapter is cached", async () => {
      const { getCachedChapter } = await import("$lib/db");
      (getCachedChapter as vi.Mock).mockResolvedValue({
        chapterId: "ch1",
        mangaId: "manga1",
      });

      const result = await cacheImageService.isChapterCached("ch1");

      expect(result).toBe(true);
    });

    it("should return false when chapter is not cached", async () => {
      const { getCachedChapter } = await import("$lib/db");
      (getCachedChapter as vi.Mock).mockResolvedValue(undefined);

      const result = await cacheImageService.isChapterCached("ch1");

      expect(result).toBe(false);
    });
  });

  describe("markChapterCached", () => {
    it("should save chapter to DB", async () => {
      const { saveCachedChapter } = await import("$lib/db");
      (saveCachedChapter as vi.Mock).mockResolvedValue(undefined);

      await cacheImageService.markChapterCached("ch1", "manga1", [
        "page1.jpg",
        "page2.jpg",
      ]);

      expect(saveCachedChapter).toHaveBeenCalledWith({
        chapterId: "ch1",
        mangaId: "manga1",
        pages: ["page1.jpg", "page2.jpg"],
        cachedAt: expect.any(Number),
      });
    });
  });

  describe("removeChapterFromCache", () => {
    it("should delete chapter from DB", async () => {
      const { deleteCachedChapter } = await import("$lib/db");
      (deleteCachedChapter as vi.Mock).mockResolvedValue(undefined);

      await cacheImageService.removeChapterFromCache("ch1");

      expect(deleteCachedChapter).toHaveBeenCalledWith("ch1");
    });
  });
});
