import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const USER_ID_KEY = 'manhau_user_id';

// Generate or get user ID from localStorage
function getOrCreateUserId(): string {
  if (!browser) return 'server_user';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export interface UserState {
  userId: string;
  favorites: Set<number>;
  history: any[];
  initialized: boolean;
}

function createUserStore() {
  const { subscribe, set, update } = writable<UserState>({
    userId: getOrCreateUserId(),
    favorites: new Set(),
    history: [],
    initialized: false
  });

  return {
    subscribe,

    async init() {
      if (!browser) return;
      
      const userId = getOrCreateUserId();
      update(s => ({ ...s, userId, initialized: true }));
      
      // Load favorites
      await this.loadFavorites();
      
      // Load history
      await this.loadHistory();
    },

    getUserId(): string {
      return getOrCreateUserId();
    },

    async loadFavorites() {
      if (!browser) return;
      
      const userId = getOrCreateUserId();
      try {
        const res = await fetch(`/api/favorites?user_id=${userId}`);
        const data = await res.json();
        if (data.success) {
          const favoriteIds = new Set<number>(data.data.map((f: any) => f.manga_id));
          update(s => ({ ...s, favorites: favoriteIds }));
        }
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    },

    async loadHistory() {
      if (!browser) return;
      
      const userId = getOrCreateUserId();
      try {
        const res = await fetch(`/api/history?user_id=${userId}&limit=50`);
        const data = await res.json();
        if (data.success) {
          update(s => ({ ...s, history: data.data }));
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    },

    async toggleFavorite(mangaId: number): Promise<boolean> {
      if (!browser) return false;
      
      const userId = getOrCreateUserId();
      const state = get({ subscribe });
      const isFavorite = state.favorites.has(mangaId);
      
      try {
        if (isFavorite) {
          const res = await fetch(`/api/favorites?manga_id=${mangaId}&user_id=${userId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            update(s => {
              const newFavorites = new Set(s.favorites);
              newFavorites.delete(mangaId);
              return { ...s, favorites: newFavorites };
            });
            return false;
          }
        } else {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-id': userId
            },
            body: JSON.stringify({ manga_id: mangaId, user_id: userId })
          });
          const data = await res.json();
          if (data.success) {
            update(s => {
              const newFavorites = new Set(s.favorites);
              newFavorites.add(mangaId);
              return { ...s, favorites: newFavorites };
            });
            return true;
          }
        }
      } catch (e) {
        console.error('Failed to toggle favorite:', e);
      }
      
      return !isFavorite;
    },

    isFavorite(mangaId: number): boolean {
      const state = get({ subscribe });
      return state.favorites.has(mangaId);
    },

    async addToHistory(mangaId: number, chapterId: number, page: number = 0) {
      if (!browser) return;
      
      const userId = getOrCreateUserId();
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({ manga_id: mangaId, chapter_id: chapterId, page, user_id: userId })
        });
        await this.loadHistory();
      } catch (e) {
        console.error('Failed to add to history:', e);
      }
    },

    async clearHistory() {
      if (!browser) return;
      
      const userId = getOrCreateUserId();
      try {
        await fetch(`/api/history?user_id=${userId}`, { 
          method: 'DELETE',
          headers: { 'x-user-id': userId }
        });
        update(s => ({ ...s, history: [] }));
      } catch (e) {
        console.error('Failed to clear history:', e);
      }
    },

    async rateManga(mangaId: number, rating: number): Promise<{ average: number; count: number } | null> {
      if (!browser) return null;
      
      const userId = getOrCreateUserId();
      try {
        const res = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({ manga_id: mangaId, rating, user_id: userId })
        });
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      } catch (e) {
        console.error('Failed to rate:', e);
      }
      return null;
    },

    async getRating(mangaId: number): Promise<{ average: number; count: number; userRating?: number } | null> {
      if (!browser) return null;
      
      const userId = getOrCreateUserId();
      try {
        const res = await fetch(`/api/ratings?manga_id=${mangaId}&user_id=${userId}`);
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      } catch (e) {
        console.error('Failed to get rating:', e);
      }
      return null;
    },

    async loadComments(mangaId: number): Promise<any[]> {
      if (!browser) return [];
      
      try {
        const res = await fetch(`/api/comments?manga_id=${mangaId}`);
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      } catch (e) {
        console.error('Failed to load comments:', e);
      }
      return [];
    },

    async postComment(mangaId: number, content: string, userName?: string): Promise<any | null> {
      if (!browser) return null;
      
      const userId = getOrCreateUserId();
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': userId
          },
          body: JSON.stringify({ manga_id: mangaId, content, user_name: userName || 'Anonymous', user_id: userId })
        });
        const data = await res.json();
        if (data.success) {
          return data.data;
        }
      } catch (e) {
        console.error('Failed to post comment:', e);
      }
      return null;
    }
  };
}

export const userStore = createUserStore();
