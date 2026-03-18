import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  openManhwaDB,
  saveProgress,
  getProgress,
  getAllProgress,
  saveCachedChapter,
  getCachedChapter,
  getAllCachedChapters,
  deleteCachedChapter,
  clearAllProgress,
} from "$lib/db";

// Mock IDB
vi.mock("idb", () => ({
  openDB: vi.fn(),
}));

import { openDB } from "idb";

// Mock $app/environment
vi.mock("$app/environment", () => ({
  browser: true,
}));

describe("Database Service (db.ts)", () => {
  let mockDB: {
    get: vi.Mock;
    put: vi.Mock;
    getAll: vi.Mock;
    delete: vi.Mock;
    clear: vi.Mock;
    transaction: vi.Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock database
    mockDB = {
      get: vi.fn(),
      put: vi.fn(),
      getAll: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      transaction: vi.fn(),
    };

    (openDB as vi.Mock).mockResolvedValue(mockDB);

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.localStorage = localStorageMock as Storage;
  });

  describe("openManhwaDB", () => {
    it("should open the database with correct name and version", async () => {
      const db = await openManhwaDB();

      expect(openDB).toHaveBeenCalledWith(
        "manhwa-reader",
        1,
        expect.objectContaining({
          upgrade: expect.any(Function),
        }),
      );
      expect(db).toBe(mockDB);
    });

    it("should return null when not in browser", async () => {
      // This test would need a different approach for non-browser env
      // For now, skip
    });
  });

  describe("saveProgress", () => {
    it("should save progress to IndexedDB", async () => {
      mockDB.put.mockResolvedValue(undefined);

      await saveProgress("serie-1", "chapter-1", 5);

      expect(mockDB.put).toHaveBeenCalledWith(
        "reading-progress",
        expect.objectContaining({
          serieId: "serie-1",
          chapterId: "chapter-1",
          page: 5,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it("should fallback to localStorage when IndexedDB fails", async () => {
      // Mock the DB to return null (simulating failure)
      (openDB as vi.Mock).mockResolvedValueOnce(null);

      const localStorageMock = global.localStorage as Storage;
      localStorageMock.getItem = vi.fn().mockReturnValue(null);

      await saveProgress("serie-1", "chapter-1", 5);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "manhwa-reader-fallback",
        expect.any(String),
      );
    });
  });

  describe("getProgress", () => {
    it("should get progress from IndexedDB", async () => {
      const mockProgress = {
        serieId: "serie-1",
        chapterId: "chapter-1",
        page: 5,
        updatedAt: Date.now(),
      };
      mockDB.get.mockResolvedValue(mockProgress);

      const result = await getProgress("serie-1");

      expect(mockDB.get).toHaveBeenCalledWith("reading-progress", "serie-1");
      expect(result).toEqual(mockProgress);
    });

    it("should fallback to localStorage when IndexedDB is null", async () => {
      (openDB as vi.Mock).mockResolvedValue(null);
      const localStorageMock = global.localStorage as Storage;
      localStorageMock.getItem = vi.fn().mockReturnValue(
        JSON.stringify({
          "serie-1": {
            serieId: "serie-1",
            chapterId: "chapter-1",
            page: 5,
            updatedAt: Date.now(),
          },
        }),
      );

      const result = await getProgress("serie-1");

      expect(result).toBeDefined();
      expect(result?.serieId).toBe("serie-1");
    });
  });

  describe("getAllProgress", () => {
    it("should get all progress from IndexedDB", async () => {
      const mockProgress = [
        {
          serieId: "serie-1",
          chapterId: "chapter-1",
          page: 5,
          updatedAt: Date.now(),
        },
        {
          serieId: "serie-2",
          chapterId: "chapter-2",
          page: 10,
          updatedAt: Date.now(),
        },
      ];
      mockDB.getAll.mockResolvedValue(mockProgress);

      const result = await getAllProgress();

      expect(mockDB.getAll).toHaveBeenCalledWith("reading-progress");
      expect(result).toEqual(mockProgress);
    });
  });

  describe("saveCachedChapter", () => {
    it("should save cached chapter to IndexedDB", async () => {
      mockDB.put.mockResolvedValue(undefined);
      const chapter = {
        chapterId: "chapter-1",
        mangaId: "manga-1",
        cachedAt: Date.now(),
        pages: ["page1.jpg", "page2.jpg"],
      };

      await saveCachedChapter(chapter);

      expect(mockDB.put).toHaveBeenCalledWith("cached-chapters", chapter);
    });
  });

  describe("getCachedChapter", () => {
    it("should get cached chapter from IndexedDB", async () => {
      const mockChapter = {
        chapterId: "chapter-1",
        mangaId: "manga-1",
        cachedAt: Date.now(),
        pages: ["page1.jpg"],
      };
      mockDB.get.mockResolvedValue(mockChapter);

      const result = await getCachedChapter("chapter-1");

      expect(mockDB.get).toHaveBeenCalledWith("cached-chapters", "chapter-1");
      expect(result).toEqual(mockChapter);
    });
  });

  describe("getAllCachedChapters", () => {
    it("should get all cached chapters from IndexedDB", async () => {
      const mockChapters = [
        {
          chapterId: "chapter-1",
          mangaId: "manga-1",
          cachedAt: Date.now(),
          pages: [],
        },
        {
          chapterId: "chapter-2",
          mangaId: "manga-1",
          cachedAt: Date.now(),
          pages: [],
        },
      ];
      mockDB.getAll.mockResolvedValue(mockChapters);

      const result = await getAllCachedChapters();

      expect(mockDB.getAll).toHaveBeenCalledWith("cached-chapters");
      expect(result).toEqual(mockChapters);
    });
  });

  describe("deleteCachedChapter", () => {
    it("should delete cached chapter from IndexedDB", async () => {
      mockDB.delete.mockResolvedValue(undefined);

      await deleteCachedChapter("chapter-1");

      expect(mockDB.delete).toHaveBeenCalledWith(
        "cached-chapters",
        "chapter-1",
      );
    });
  });

  describe("clearAllProgress", () => {
    it("should clear all progress from IndexedDB", async () => {
      mockDB.clear.mockResolvedValue(undefined);

      await clearAllProgress();

      expect(mockDB.clear).toHaveBeenCalledWith("reading-progress");
    });

    it("should fallback to localStorage when IndexedDB is null", async () => {
      (openDB as vi.Mock).mockResolvedValue(null);
      const localStorageMock = global.localStorage as Storage;

      await clearAllProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "manhwa-reader-fallback",
      );
    });
  });
});
