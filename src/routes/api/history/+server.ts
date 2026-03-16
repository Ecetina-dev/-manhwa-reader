import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHistoryByUser, addToHistory, clearHistory } from '$lib/server/sqlite';

// Get user ID from header, body, or generate from IP
function getUserId(request: Request, body?: any): string {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;
  if (body?.user_id) return body.user_id;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  return `user_${ip.replace(/[^a-z0-9]/g, '')}`;
}

export const GET: RequestHandler = async ({ url }) => {
  const userId = url.searchParams.get('user_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  if (!userId) {
    return json({ success: false, error: 'User ID required' }, { status: 400 });
  }
  
  const history = getHistoryByUser(userId, limit);
  
  return json({
    success: true,
    data: history
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = getUserId(request, body);
    
    if (!body.manga_id || !body.chapter_id) {
      return json({ success: false, error: 'Manga ID and chapter ID required' }, { status: 400 });
    }
    
    if (!userId) {
      return json({ success: false, error: 'User ID required' }, { status: 400 });
    }
    
    const historyEntry = addToHistory({
      manga_id: Number(body.manga_id),
      chapter_id: Number(body.chapter_id),
      user_id: userId,
      page: body.page || 0
    });
    
    return json({
      success: true,
      data: historyEntry
    });
  } catch (e) {
    return json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
};

export const DELETE: RequestHandler = async ({ url, request }) => {
  const userId = url.searchParams.get('user_id') || request.headers.get('x-user-id');
  
  if (!userId) {
    return json({ success: false, error: 'User ID required' }, { status: 400 });
  }
  
  const cleared = clearHistory(userId);
  
  return json({ success: cleared });
};
