import { writable } from 'svelte/store';
import type { ReadingProgress } from './types';

const STORAGE_KEY = 'manhwa-reader-progress';

function createReadingStore() {
  const { subscribe, set, update } = writable<ReadingProgress[]>([]);
  
  function load() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load reading progress', e);
      }
    }
  }
  
  function save(progress: ReadingProgress[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
  
  return {
    subscribe,
    
    init() {
      load();
    },
    
    updateProgress(serieId: string, chapterId: string, page: number) {
      update(progress => {
        const index = progress.findIndex(p => p.serieId === serieId);
        const newProgress: ReadingProgress = {
          serieId,
          chapterId,
          page,
          updatedAt: Date.now()
        };
        
        let updated: ReadingProgress[];
        if (index >= 0) {
          updated = [...progress];
          updated[index] = newProgress;
        } else {
          updated = [...progress, newProgress];
        }
        
        save(updated);
        return updated;
      });
    },
    
    getProgress(serieId: string): ReadingProgress | undefined {
      let progress: ReadingProgress | undefined;
      subscribe(p => {
        progress = p.find(pr => pr.serieId === serieId);
      })();
      return progress;
    },
    
    clear() {
      set([]);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };
}

export const readingStore = createReadingStore();
