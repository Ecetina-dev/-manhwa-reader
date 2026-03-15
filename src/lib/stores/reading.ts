import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { ReadingProgress, StoredReadingProgress } from '$lib/types';
import { 
  saveProgress, 
  getProgress, 
  getAllProgress, 
  clearAllProgress,
  migrateFromLocalStorage 
} from '$lib/db';

const STORAGE_KEY = 'manhwa-reader-progress';

/**
 * Reading Progress Store using IndexedDB
 * Maintains localStorage fallback for unsupported browsers
 */
function createReadingStore() {
  const { subscribe, set, update } = writable<ReadingProgress[]>([]);
  
  /**
   * Load progress from IndexedDB (or localStorage fallback)
   */
  async function load(): Promise<void> {
    if (!browser) return;
    
    try {
      // Try to migrate from localStorage first time
      await migrateFromLocalStorage();
      
      // Load from IndexedDB
      const progress = await getAllProgress();
      if (progress && progress.length > 0) {
        set(progress);
      } else {
        // Fallback: try localStorage if IndexedDB is empty
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set(parsed);
          } catch (e) {
            console.error('Failed to parse localStorage progress', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load reading progress', error);
      
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          set(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to load reading progress from localStorage', e);
        }
      }
    }
  }
  
  /**
   * Save progress to localStorage (backup) and IndexedDB
   */
  function save(progress: ReadingProgress[]): void {
    if (!browser) return;
    
    // Save to localStorage as backup
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }
  
  return {
    subscribe,
    
    /**
     * Initialize the store - loads progress from storage
     */
    async init(): Promise<void> {
      await load();
    },
    
    /**
     * Update reading progress for a serie
     */
    async updateProgress(serieId: string, chapterId: string, page: number): Promise<void> {
      const newProgress: ReadingProgress = {
        serieId,
        chapterId,
        page,
        updatedAt: Date.now(),
      };
      
      // Update local store
      update(progress => {
        const index = progress.findIndex(p => p.serieId === serieId);
        let updated: ReadingProgress[];
        
        if (index >= 0) {
          updated = [...progress];
          updated[index] = newProgress;
        } else {
          updated = [...progress, newProgress];
        }
        
        // Save to localStorage backup
        save(updated);
        
        return updated;
      });
      
      // Save to IndexedDB (async, don't await)
      try {
        await saveProgress(serieId, chapterId, page);
      } catch (error) {
        console.error('Failed to save progress to IndexedDB', error);
      }
    },
    
    /**
     * Get progress for a specific serie
     */
    async getProgress(serieId: string): Promise<ReadingProgress | undefined> {
      // First check local store
      const progress = get({ subscribe });
      const found = progress.find(p => p.serieId === serieId);
      
      if (found) return found;
      
      // Fallback: try IndexedDB
      if (browser) {
        try {
          return await getProgress(serieId);
        } catch (error) {
          console.error('Failed to get progress from IndexedDB', error);
        }
      }
      
      return undefined;
    },
    
    /**
     * Get progress synchronously from local store
     * Use this for quick reads
     */
    getProgressSync(serieId: string): ReadingProgress | undefined {
      const progress = get({ subscribe });
      return progress.find(p => p.serieId === serieId);
    },
    
    /**
     * Clear all progress
     */
    async clear(): Promise<void> {
      set([]);
      
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
        try {
          await clearAllProgress();
        } catch (error) {
          console.error('Failed to clear IndexedDB', error);
        }
      }
    }
  };
}

export const readingStore = createReadingStore();
