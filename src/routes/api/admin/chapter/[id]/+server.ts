import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getChapterById, deleteChapter } from '$lib/server/sqlite';

export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    return json({ success: false, error: 'Chapter ID required' }, { status: 400 });
  }
  
  const chapter = getChapterById(Number(id));
  
  if (!chapter) {
    return json({ success: false, error: 'Chapter not found' }, { status: 404 });
  }
  
  const deleted = deleteChapter(Number(id));
  
  return json({
    success: deleted,
    data: { deleted }
  });
};
