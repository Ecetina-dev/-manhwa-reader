import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMangaById, updateManga, deleteManga, getChaptersByManga } from '$lib/server/sqlite';

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  const manga = getMangaById(Number(id));
  
  if (!manga) {
    return json({ success: false, error: 'Manga not found' }, { status: 404 });
  }
  
  const chapters = getChaptersByManga(Number(id));
  
  return json({
    success: true,
    data: { ...manga, chapters }
  });
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  const manga = getMangaById(Number(id));
  
  if (!manga) {
    return json({ success: false, error: 'Manga not found' }, { status: 404 });
  }
  
  try {
    const data = await request.json();
    
    const updated = updateManga(Number(id), {
      title: data.title,
      description: data.description,
      cover: data.cover,
      status: data.status,
      type: data.type,
      demographic: data.demographic,
      author: data.author,
      artist: data.artist,
      tags: data.tags
    });
    
    return json({
      success: true,
      data: updated
    });
  } catch (e) {
    return json({
      success: false,
      error: 'Invalid request data'
    }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  const manga = getMangaById(Number(id));
  
  if (!manga) {
    return json({ success: false, error: 'Manga not found' }, { status: 404 });
  }
  
  const deleted = deleteManga(Number(id));
  
  return json({
    success: deleted,
    data: { deleted }
  });
};
