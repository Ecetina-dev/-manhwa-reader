import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRatingByManga, getRatingByUser, setRating } from '$lib/server/sqlite';
import { isValidMangaId, isValidRating } from '$lib/services/sanitizer';

// Get user ID from header, body, or generate
function getUserId(request: Request, body?: any): string {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;
  if (body?.user_id) return body.user_id;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return `user_${ip.replace(/[^a-z0-9]/g, '')}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const mangaId = url.searchParams.get('manga_id');
  const userId = url.searchParams.get('user_id');
  
  if (!mangaId) {
    return json({ success: false, error: 'Manga ID required' }, { status: 400 });
  }
  
  // Validate manga ID
  if (!isValidMangaId(mangaId)) {
    return json({ success: false, error: 'Invalid Manga ID' }, { status: 400 });
  }
  
  const ratingData = getRatingByManga(Number(mangaId));
  
  // If user_id provided, also get user's rating
  if (userId) {
    const userRating = getRatingByUser(Number(mangaId), userId);
    return json({
      success: true,
      data: {
        ...ratingData,
        userRating
      }
    });
  }
  
  return json({
    success: true,
    data: ratingData
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = getUserId(request, body);
    
    if (!body.manga_id || body.rating === undefined) {
      return json({ success: false, error: 'Manga ID and rating required' }, { status: 400 });
    }
    
    // Validate manga ID
    if (!isValidMangaId(body.manga_id)) {
      return json({ success: false, error: 'Invalid Manga ID' }, { status: 400 });
    }
    
    if (!userId) {
      return json({ success: false, error: 'User ID required' }, { status: 400 });
    }
    
    // Validate rating using sanitizer
    const ratingNum = Number(body.rating);
    if (!isValidRating(ratingNum)) {
      return json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    
    const result = setRating({
      manga_id: Number(body.manga_id),
      user_id: userId,
      rating: ratingNum
    });
    
    return json({
      success: true,
      data: result
    });
  } catch (e) {
    return json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
};
