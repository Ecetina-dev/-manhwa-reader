import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createChapter, getMangaById } from '$lib/server/sqlite';

export const POST: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  const mangaId = Number(id);
  const manga = getMangaById(mangaId);
  
  if (!manga) {
    return json({ success: false, error: 'Manga not found' }, { status: 404 });
  }
  
  try {
    const data = await request.json();
    
    const chapter = createChapter({
      manga_id: mangaId,
      chapter_number: data.chapter_number,
      title: data.title || '',
      volume: data.volume || ''
    });
    
    return json({
      success: true,
      data: chapter
    }, { status: 201 });
  } catch (e) {
    return json({
      success: false,
      error: 'Invalid request data'
    }, { status: 400 });
  }
};
