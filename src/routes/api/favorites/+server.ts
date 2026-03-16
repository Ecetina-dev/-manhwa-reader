import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFavoritesByUser, isFavorite, addFavorite, removeFavorite } from '$lib/server/sqlite';

// Generate simple user ID based on localStorage
function getUserId(request: Request): string {
  // First try to get from header (sent by client)
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) {
    return headerUserId;
  }
  // Fallback to IP-based (not recommended for this use case)
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return `user_${ip.replace(/[^a-z0-9]/g, '')}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const userId = url.searchParams.get('user_id');
  const mangaId = url.searchParams.get('manga_id');
  
  if (!userId) {
    return json({ success: false, error: 'User ID required' }, { status: 400 });
  }
  
  // Check if specific manga is favorite
  if (mangaId) {
    const favorite = isFavorite(Number(mangaId), userId);
    return json({ success: true, data: { isFavorite: favorite } });
  }
  
  // Get all favorites for user
  const favorites = getFavoritesByUser(userId);
  
  return json({
    success: true,
    data: favorites
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    // Get userId from header first, then body, then fallback
    const userId = request.headers.get('x-user-id') || body.user_id || getUserId(request);
    
    if (!body.manga_id) {
      return json({ success: false, error: 'Manga ID required' }, { status: 400 });
    }
    
    if (!userId) {
      return json({ success: false, error: 'User ID required' }, { status: 400 });
    }
    
    const added = addFavorite(Number(body.manga_id), userId);
    
    return json({
      success: added,
      data: { isFavorite: true }
    });
  } catch (e) {
    return json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ url, request }) => {
  const mangaId = url.searchParams.get('manga_id');
  const userId = url.searchParams.get('user_id') || request.headers.get('x-user-id');
  
  if (!mangaId || !userId) {
    return json({ success: false, error: 'Manga ID and user ID required' }, { status: 400 });
  }
  
  const removed = removeFavorite(Number(mangaId), userId);
  
  return json({ success: removed, data: { isFavorite: false } });
};
