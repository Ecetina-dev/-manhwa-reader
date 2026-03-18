import type {
  MangaDexManga,
  MangaDexChapter,
  MangaDexPage,
  Serie,
  Chapter,
} from "$lib/types";
import { withThrottle } from "$lib/services/rate-limiter.service";
import { cacheImageService } from "$lib/services/cache-image.service";

const MANGADEX_API = "https://api.mangadex.org";

/**
 * Fetch with rate limiting
 */
async function throttledFetch(url: string): Promise<Response> {
  return withThrottle(() => fetch(url));
}

/**
 * Get list of manga with pagination
 */
export async function getMangaList(offset = 0, limit = 20): Promise<Serie[]> {
  try {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    params.set("includes[]", "cover_art");
    params.set("order[relevance]", "desc");
    params.set("availableTranslatedLanguage[]", "en");
    params.set("hasAvailableChapters", "true");

    const response = await throttledFetch(
      `${MANGADEX_API}/manga?${params.toString()}`,
    );
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      console.warn("[MangaDex] No manga data found");
      return [];
    }

    // Map manga with better error handling
    const mangaList: Serie[] = [];

    for (const item of data.data) {
      try {
        const manga = mapMangaData(item);
        if (manga && manga.title !== "Unknown") {
          mangaList.push(manga);
        }
      } catch (e) {
        console.warn("[MangaDex] Error mapping manga:", e);
      }
    }

    // Preload covers
    const coverUrls = mangaList.filter((m) => m.cover).map((m) => m.cover);

    if (coverUrls.length > 0) {
      cacheImageService.preloadImages(coverUrls).catch(() => {});
    }

    return mangaList;
  } catch (error) {
    console.error("[MangaDex] Error fetching manga list:", error);
    return [];
  }
}

/**
 * Get manga details by ID
 */
export async function getMangaById(id: string): Promise<Serie> {
  console.log("[MangaDex] Fetching manga:", id);

  const params = new URLSearchParams();
  params.set("includes[]", "cover_art");
  params.set("includes[]", "author");
  params.set("includes[]", "artist");

  const response = await throttledFetch(
    `${MANGADEX_API}/manga/${id}?${params.toString()}`,
  );

  if (!response.ok) {
    console.error("[MangaDex] Error fetching manga:", response.status);
    throw new Error(`Failed to fetch manga: ${response.status}`);
  }

  const data = await response.json();
  console.log("[MangaDex] Manga data received, fetching chapters...");

  const chapters = await getChapters(id);
  console.log("[MangaDex] Chapters received:", chapters.length);

  const manga = mapMangaData(data.data);

  if (!manga) {
    throw new Error("Failed to parse manga data");
  }

  // Cache cover
  if (manga?.cover) {
    cacheImageService.getImageWithRetry(manga.cover).catch(() => {});
  }

  return {
    ...manga,
    chapters,
  };
}

/**
 * Get chapter list for a manga
 */
export async function getChapters(mangaId: string): Promise<Chapter[]> {
  console.log("[MangaDex] Fetching chapters for:", mangaId);

  try {
    const params = new URLSearchParams();
    params.set("limit", "100");
    params.set("includes[]", "scanlation_group");
    params.set("order[chapter]", "desc");
    params.set("translatedLanguage[]", "en");

    const response = await throttledFetch(
      `${MANGADEX_API}/manga/${mangaId}/feed?${params.toString()}`,
    );

    if (!response.ok) {
      console.error("[MangaDex] Error fetching chapters:", response.status);
      return [];
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      console.log("[MangaDex] No chapter data found");
      return [];
    }

    // Deduplicate by chapter number
    const chapterMap = new Map<string, Chapter>();

    for (const item of data.data) {
      const chapterNum = item.attributes?.chapter || "0";
      if (!chapterMap.has(chapterNum)) {
        chapterMap.set(chapterNum, {
          id: item.id,
          number: chapterNum,
          title: item.attributes?.title || "",
          pages: item.attributes?.pages || 0,
          publishAt: item.attributes?.publishAt || "",
        });
      }
    }

    // Sort by chapter number descending
    return Array.from(chapterMap.values()).sort((a, b) => {
      const aNum = parseFloat(a.number) || 0;
      const bNum = parseFloat(b.number) || 0;
      return bNum - aNum;
    });
  } catch (error) {
    console.error("[MangaDex] Error in getChapters:", error);
    return [];
  }
}

/**
 * Get pages for a chapter
 */
export async function getChapterPages(
  chapterId: string,
  mangaId?: string,
): Promise<MangaDexPage[]> {
  // Try cache first
  try {
    const cached = await cacheImageService
      .getCachedChapters()
      .then((chapters) => chapters.find((c) => c.chapterId === chapterId));

    if (cached?.pages?.length) {
      return cached.pages.map((url) => ({ url, width: 0, height: 0 }));
    }
  } catch (e) {
    console.warn("[MangaDex] Cache check failed");
  }

  // Fetch from API
  const response = await throttledFetch(
    `${MANGADEX_API}/at-home/server/${chapterId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch chapter: ${response.status}`);
  }

  const data = await response.json();

  if (!data.baseUrl || !data.chapter?.data) {
    return [];
  }

  const { baseUrl, chapter } = data;
  const pages: MangaDexPage[] = chapter.data.map((filename: string) => ({
    url: `${baseUrl}/data/${chapter.hash}/${filename}`,
    width: 0,
    height: 0,
  }));

  // Cache chapter
  if (mangaId && pages.length) {
    try {
      await cacheImageService.markChapterCached(
        chapterId,
        mangaId,
        pages.map((p) => p.url),
      );
    } catch (e) {
      console.warn("[MangaDex] Cache failed");
    }
  }

  return pages;
}

/**
 * Search manga
 */
export async function searchManga(query: string): Promise<Serie[]> {
  if (!query.trim()) return [];

  try {
    const params = new URLSearchParams();
    params.set("title", query);
    params.set("limit", "20");
    params.set("includes[]", "cover_art");
    params.set("availableTranslatedLanguage[]", "en");
    params.set("hasAvailableChapters", "true");

    const response = await throttledFetch(
      `${MANGADEX_API}/manga?${params.toString()}`,
    );
    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) return [];

    const results: Serie[] = [];
    for (const item of data.data) {
      const manga = mapMangaData(item);
      if (manga && manga.title !== "Unknown") {
        results.push(manga);
      }
    }

    return results;
  } catch (error) {
    console.error("[MangaDex] Search error:", error);
    return [];
  }
}

/**
 * Map MangaDex data to Serie
 */
function mapMangaData(item: any): Serie | null {
  if (!item?.id || !item?.attributes) return null;

  const manga = item;
  const attrs = manga.attributes;

  // Get title
  let title = "Unknown";
  if (attrs.title?.en) {
    title = attrs.title.en;
  } else if (attrs.title?.["ja-ro"]) {
    title = attrs.title["ja-ro"];
  } else if (attrs.title?.ja) {
    title = attrs.title.ja;
  } else if (attrs.title) {
    const titles = Object.values(attrs.title);
    if (titles.length > 0) {
      title = String(titles[0]);
    }
  }

  // Get description
  let description = "";
  if (attrs.description?.en) {
    description = attrs.description.en;
  } else if (attrs.description) {
    const descs = Object.values(attrs.description);
    if (descs.length > 0) {
      description = String(descs[0]);
    }
  }

  // Get cover - MangaDex API v5 format
  let cover = "";
  const coverRel = manga.relationships?.find(
    (r: any) => r.type === "cover_art",
  );

  if (coverRel?.attributes?.fileName) {
    const fileName = coverRel.attributes.fileName;
    // Construct URL: https://uploads.mangadex.org/covers/{manga-id}/{filename}
    cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
  }

  return {
    id: manga.id,
    title,
    cover,
    description: description.substring(0, 300),
    status: attrs.status || "unknown",
    chapters: [],
  };
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(url: string): string {
  if (!url) return "";

  // For chapter pages
  if (url.includes("/data/")) {
    return url;
  }

  // For covers - use 512 size
  if (url.includes("/covers/")) {
    // If URL already has size, leave it
    if (url.match(/\.\d+\./)) {
      return url;
    }
    // Otherwise use direct URL as-is (it should have the size in filename)
    return url;
  }

  return url;
}

/**
 * Get cached image URL
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  const optimized = getOptimizedImageUrl(url);
  return cacheImageService.getImageWithRetry(optimized);
}

/**
 * Check if chapter is cached
 */
export async function isChapterAvailableOffline(
  chapterId: string,
): Promise<boolean> {
  return cacheImageService.isChapterCached(chapterId);
}
