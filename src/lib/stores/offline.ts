import { browser } from '$app/environment';
import { networkStatus, isOnline } from '$lib/services/network-status.service';
import type { OfflineStatus, CachedChapter } from '$lib/types';
import { cacheImageService } from '$lib/services/cache-image.service';

/**
 * Offline Store using Svelte 5 runes
 * Manages offline state and cached chapters
 */
function createOfflineStore() {
  // Define state first
  const offlineState = {
    isOnline: true,
    lastOnline: null as number | null,
    cachedChapters: [] as CachedChapter[],
  };
  
  // Initialize in browser environment
  if (browser) {
    // Set initial online state
    offlineState.isOnline = navigator.onLine;
    
    // Subscribe to network status
    networkStatus.subscribe((state) => {
      offlineState.isOnline = state.isOnline;
      offlineState.lastOnline = state.lastOnline;
    });
    
    // Initialize cached chapters
    cacheImageService.getCachedChapters().then((chapters) => {
      offlineState.cachedChapters = chapters;
    }).catch(() => {});
  }
  
  /**
   * Update the cached chapters list
   */
  async function updateCachedChapters(): Promise<CachedChapter[]> {
    if (!browser) return [];
    
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
