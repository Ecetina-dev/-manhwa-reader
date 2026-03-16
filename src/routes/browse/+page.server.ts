import type { PageServerLoad } from './$types';
import { getAllManga, getChaptersByManga, seedDatabase } from '$lib/server/sqlite';

seedDatabase();

export const load: PageServerLoad = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || '';
  const type = url.searchParams.get('type') || '';
  const demographic = url.searchParams.get('demographic') || '';
  const sort = url.searchParams.get('sort') || 'updated';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 24;
  const offset = (page - 1) * limit;
  
  const manga = getAllManga({
    search: query || undefined,
    status: status || undefined,
    type: type || undefined,
    demographic: demographic || undefined,
    sort,
    limit,
    offset
  });
  
  const totalManga = getAllManga({
    search: query || undefined,
    status: status || undefined,
    type: type || undefined,
    demographic: demographic || undefined,
    sort
  });
  
  const series = manga.map(m => {
    const chapters = getChaptersByManga(m.id);
    return {
      id: String(m.id),
      title: m.title,
      cover: m.cover || '',
      description: m.description || '',
      status: m.status,
      type: m.type,
      demographic: m.demographic,
      tags: m.tags,
      chapters: chapters.map(ch => ({
        id: String(ch.id),
        number: ch.chapter_number,
        title: ch.title || '',
        pages: ch.pages,
        publishAt: ch.publish_at
      }))
    };
  });
  
  return {
    series,
    filters: {
      q: query,
      status,
      type,
      demographic,
      sort,
      page,
      total: totalManga.length,
      totalPages: Math.ceil(totalManga.length / limit)
    }
  };
};
