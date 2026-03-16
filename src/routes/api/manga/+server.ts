import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllManga, getMangaById, getChaptersByManga, getChapterPages as getPages, seedDatabase } from '$lib/server/sqlite';

export const GET: RequestHandler = async ({ url }) => {
  // Seed database on first load
  seedDatabase();
  
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  const manga = getAllManga({
    search: search || undefined,
    status: status || undefined,
    limit,
    offset
  });
  
  return json({
    success: true,
    data: manga,
    pagination: {
      limit,
      offset,
      hasMore: manga.length === limit
    }
  });
};
