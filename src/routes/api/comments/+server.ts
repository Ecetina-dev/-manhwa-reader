import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCommentsByManga, createComment, deleteComment } from '$lib/server/sqlite';
import { sanitizeComment, sanitizeMangaContent, isValidMangaId } from '$lib/services/sanitizer';

// Generate simple user ID from IP + random (for anonymous users)
function getUserId(request: Request): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  // In production, use proper session management
  return `user_${ip.replace(/[^a-z0-9]/g, '')}_${Date.now()}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const mangaId = url.searchParams.get('manga_id');
  
  if (!mangaId) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  // Validate manga ID
  if (!isValidMangaId(mangaId)) {
    return json({ success: false, error: 'Invalid Manga ID' }, { status: 400 });
  }
  
  const comments = getCommentsByManga(Number(mangaId));
  
  return json({
    success: true,
    data: comments
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || getUserId(request);
    
    if (!body.manga_id || !body.content) {
      return json({ success: false, error: 'Manga ID and content required' }, { status: 400 });
    }
    
    // Validate manga ID
    if (!isValidMangaId(body.manga_id)) {
      return json({ success: false, error: 'Invalid Manga ID' }, { status: 400 });
    }
    
    // Sanitize inputs
    const sanitizedContent = sanitizeComment(body.content);
    const sanitizedName = body.user_name 
      ? sanitizeMangaContent(body.user_name).substring(0, 50) 
      : 'Anonymous';
    
    if (!sanitizedContent || sanitizedContent.length < 1) {
      return json({ success: false, error: 'Invalid comment content' }, { status: 400 });
    }
    
    const comment = createComment({
      manga_id: Number(body.manga_id),
      user_id: userId,
      user_name: sanitizedName,
      content: sanitizedContent
    });
    
    return json({
      success: true,
      data: comment
    }, { status: 201 });
  } catch (e) {
    return json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');
  
  if (!id || !userId) {
    return json({ success: false, error: 'ID and user_id required' }, { status: 400 });
  }
  
  // Validate IDs
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) {
    return json({ success: false, error: 'Invalid ID' }, { status: 400 });
  }
  
  const deleted = deleteComment(numId, userId);
  
  return json({ success: deleted });
};
