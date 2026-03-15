import { browser } from '$app/environment';
import { networkStatus, isOnline } from '$lib/services/network-status.service';
import type { OfflineStatus, CachedChapter } from '$lib/types';
import { cacheImageService } from '$lib/services/cache-image.service';
import { get } from 'svelte/store';

/**
 * Offline Store using Svelte 5 runes
 * Manages offline state and cached chapters
 */
function createOfflineStore() {
  if (!browser) {
    return {
      get isOnline() { return true; },
      get isOffline() { return false; },
      get lastOnline() { return null; },
      get cachedChapters() { return []; },
      async updateCachedChapters() { return []; },
      async getOfflineStatus(): Promise<OfflineStatus> {
        return { isOnline: true, lastOnline: null, cachedChapters: [] };
      },
    };
  }
  
  // Subscribe to network status
  const unsubscribe = networkStatus.subscribe((state) => {
    // Trigger reactivity by updating the state
    offlineState.isOnline = state.isOnline;
    offlineState.lastOnline = state.lastOnline;
  });
  
  const offlineState = {
    isOnline: true,
    lastOnline: null as number | null,
    cachedChapters: [] as CachedChapter[],
  };
  
  /**
   * Update the cached chapters list
   */
  async function updateCachedChapters(): Promise<CachedChapter[]> {
    try {
      offlineState.cachedChapters = await cacheImageService.getCachedChapters();
      return offlineState.cachedChapters;
    } catch (error) {
      console.error('Failed to update cached chapters:', error);
      return [];
    }
  }
  
  /**
   * Get current offline status
   */
  async function getOfflineStatus(): Promise<OfflineStatus> {
    const chapters = await updateCachedChapters();
    
    return {
      isOnline: isOnline(),
      lastOnline: offlineState.lastOnline,
      cachedChapters: chapters.map((c) => c.chapterId),
    };
  }
  
  // Initialize cached chapters
  if (browser) {
    updateCachedChapters();
  }
  
  return {
    get isOnline() { return offlineState.isOnline; },
    get isOffline() { return !offlineState.isOnline; },
    get lastOnline() { return offlineState.lastOnline; },
    get cachedChapters() { return offlineState.cachedChapters; },
    updateCachedChapters,
    getOfflineStatus,
  };
}

/**
 * Singleton offline store instance
 */
export const offlineStore = createOfflineStore();
