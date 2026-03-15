import type { MangaDexManga, MangaDexChapter, MangaDexPage, Serie, Chapter } from './types';

const MANGADEX_API = 'https://api.mangadex.org';
const COVER_URL = 'https://uploads.mangadex.org/covers';

export async function getMangaList(offset = 0, limit = 20): Promise<Serie[]> {
  const response = await fetch(
    `${MANGADEX_API}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[relevance]=desc`
  );
  const data = await response.json();
  
  if (!data.data) return [];
  
  return data.data.map((manga: MangaDexManga) => mapManga(manga));
}

export async function getMangaById(id: string): Promise<Serie> {
  const response = await fetch(
    `${MANGADEX_API}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`
  );
  const data = await response.json();
  
  const chapters = await getChapters(id);
  
  return {
    ...mapManga(data.data),
    chapters
  };
}

export async function getChapters(mangaId: string): Promise<Chapter[]> {
  const response = await fetch(
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

export async function getChapterPages(chapterId: string): Promise<MangaDexPage[]> {
  const response = await fetch(
    `${MANGADEX_API}/at-home/server/${chapterId}`
  );
  const data = await response.json();
  
  if (!data.baseUrl) return [];
  
  const baseUrl = data.baseUrl;
  const chapter = data.chapter;
  
  return chapter.data.map((filename: string): MangaDexPage => ({
    url: `${baseUrl}/data/${chapter.hash}/${filename}`,
    width: 0,
    height: 0
  }));
}

export async function searchManga(query: string): Promise<Serie[]> {
  const response = await fetch(
    `${MANGADEX_API}/manga?title=${encodeURIComponent(query)}&limit=20&includes[]=cover_art`
  );
  const data = await response.json();
  
  if (!data.data) return [];
  
  return data.data.map((manga: MangaDexManga) => mapManga(manga));
}

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

export function getOptimizedImageUrl(url: string, quality = 70): string {
  if (!url) return '';
  if (url.includes('mangadex')) {
    return url.replace('/data/', '/data/compressed/').replace('.jpg', `.webp?quality=${quality}`);
  }
  return url;
}
