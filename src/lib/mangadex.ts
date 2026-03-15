import type { MangaDexManga, MangaDexChapter, MangaDexPage, Serie, Chapter } from '$lib/types';
import { rateLimiter, withThrottle } from '$lib/services/rate-limiter.service';
import { cacheImageService } from '$lib/services/cache-image.service';

const MANGADEX_API = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org/covers';

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
  const response = await throttledFetch(
    `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[relevance]=desc`
  );
  const data = await response.json();
  
  if (!data.data) return [];
  
  // Cache cover images
  const mangaList = data.data.map((manga: MangaDexManga) => mapManga(manga));
  
  // Preload covers in background
  const coverUrls = mangaList
    .filter((m: Serie) => m.cover)
    .map((m: Serie) => getOptimizedImageUrl(m.cover));
  
  if (coverUrls.length > 0) {
    cacheImageService.preloadImages(coverUrls).catch(() => {});
  }
  
  return mangaList;
}

/**
 * Get manga details by ID
 */
export async function getMangaById(id: string): Promise<Serie> {
  const response = await throttledFetch(
    `${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`
  );
  const data = await response.json();
  
  const chapters = await getChapters(id);
  
  // Cache cover image
  const manga = mapManga(data.data);
  if (manga.cover) {
    cacheImageService.getImageWithRetry(getOptimizedImageUrl(manga.cover)).catch(() => {});
  }
  
  return {
    ...manga,
    chapters
  };
}

/**
 * Get chapter list for a manga
 */
export async function getChapters(mangaId: string): Promise<Chapter[]> {
  const response = await throttledFetch(
    `${MANGADEX_API}/manga/${mangaId}/feed?limit=100&includes[]=scanlation_group&order[chapter]=desc`
  );
  const data = await response.json();
  
  if (!data.data) return [];
  
  const chapterMap = new Map<string, MangaDexChapter>();
  
  for (const chapter of data.data) {
    const chNum = chapter.attributes.chapter || '0';
    if (!chapterMap.has(chNum)) {
      chapterMap.set(chNum, chapter);
    }
  }
  
  return Array.from(chapterMap.values())
    .sort((a, b) => {
      const aNum = parseFloat(a.attributes.chapter || '0');
      const bNum = parseFloat(b.attributes.chapter || '0');
      return bNum - aNum;
    })
    .map((chapter): Chapter => ({
      id: chapter.id,
      number: chapter.attributes.chapter || '1',
      title: chapter.attributes.title || '',
      pages: chapter.attributes.pages,
      publishAt: chapter.attributes.publishAt
    }));
}

/**
 * Get pages for a chapter
 * Uses caching and retry logic
 */
export async function getChapterPages(chapterId: string, mangaId?: string): Promise<MangaDexPage[]> {
  // Try to get cached chapter first
  const cachedChapter = await cacheImageService.getCachedChapters()
    .then(chapters => chapters.find(c => c.chapterId === chapterId));
  
  if (cachedChapter && cachedChapter.pages.length > 0) {
    // Return cached pages with cached URLs
    return cachedChapter.pages.map((url): MangaDexPage => ({
      url,
      width: 0,
      height: 0
    }));
  }
  
  // Fetch from API with rate limiting
  const response = await throttledFetch(
    `${MANGADEX_API}/at-home/server/${chapterId}`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch chapter: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.baseUrl) return [];
  
  const baseUrl = data.baseUrl;
  const chapter = data.chapter;
  
  // Get optimized URLs
  const pages = chapter.data.map((filename: string): MangaDexPage => ({
    url: `${baseUrl}/data/${chapter.hash}/${filename}`,
    width: 0,
    height: 0
  }));
  
  // Cache chapter pages for offline reading
  const optimizedUrls = pages.map((p: MangaDexPage) => getOptimizedImageUrl(p.url));
  if (mangaId) {
    await cacheImageService.markChapterCached(chapterId, mangaId, optimizedUrls);
  }
  
  // Preload first few pages
  if (optimizedUrls.length > 0) {
    const preloadUrls = optimizedUrls.slice(0, 5);
    cacheImageService.preloadImages(preloadUrls).catch(() => {});
  }
  
  return pages;
}

/**
 * Search manga by query
 */
export async function searchManga(query: string): Promise<Serie[]> {
  const response = await throttledFetch(
    `${MANGADEX_API}/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art`
  );
  const data = await response.json();
  
  if (!data.data) return [];
  
  return data.data.map((manga: MangaDexManga) => mapManga(manga));
}

/**
 * Map MangaDex API response to our Serie type
 */
function mapManga(manga: MangaDexManga): Serie {
  const title = manga.attributes.title.en || 
                manga.attributes.title['ja-ro'] || 
                Object.values(manga.attributes.title)[0] || 
                'Unknown';
  
  const description = manga.attributes.description?.en || '';
  
  const coverRel = manga.relationships.find(r => r.type === 'cover_art');
  const coverFileName = coverRel?.attributes?.fileName || '';
  const cover = coverFileName 
    ? `${COVER_URL}/${manga.id}/${coverFileName}.256.jpg`
    : '';
  
  return {
    id: manga.id,
    title,
    cover,
    description,
    status: manga.attributes.status,
    chapters: []
  };
}

/**
 * Get optimized image URL with WebP compression
 */
export function getOptimizedImageUrl(url: string, quality = 70): string {
  if (!url) return '';
  if (url.includes('mangadex')) {
    return url.replace('/data/', '/data/compressed/').replace('.jpg', `.webp?quality=${quality}`);
  }
  return url;
}

/**
 * Get image with caching and retry
 * This is the main method for getting images in the reader
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  const optimizedUrl = getOptimizedImageUrl(url);
  return cacheImageService.getImageWithRetry(optimizedUrl);
}

/**
 * Check if a chapter is available offline
 */
export async function isChapterAvailableOffline(chapterId: string): Promise<boolean> {
  return cacheImageService.isChapterCached(chapterId);
}
