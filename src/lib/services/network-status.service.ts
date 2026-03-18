import { browser } from "$app/environment";
import { readable, type Readable } from "svelte/store";

export interface NetworkStatusState {
  isOnline: boolean;
  lastOnline: number | null;
}

/**
 * Creates a network status store that tracks online/offline state
 */
function createNetworkStatusStore() {
  if (!browser) {
    return readable<NetworkStatusState>({ isOnline: true, lastOnline: null });
  }

  const initialState: NetworkStatusState = {
    isOnline: navigator.onLine,
    lastOnline: navigator.onLine ? Date.now() : null,
  };

  return readable<NetworkStatusState>(initialState, (set) => {
    const handleOnline = () => {
      set({
        isOnline: true,
        lastOnline: Date.now(),
      });
    };

    const handleOffline = () => {
      set({
        isOnline: false,
        lastOnline: Date.now(),
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });
}

/**
 * Singleton network status store instance
 */
export const networkStatus = createNetworkStatusStore();

/**
 * Helper to check if we're currently online
 */
export function isOnline(): boolean {
  if (!browser) return true;
  return navigator.onLine;
}

/**
 * Subscribe to network status changes
 * Returns an unsubscribe function
 */
export function onNetworkStatusChange(
  callback: (isOnline: boolean) => void,
): () => void {
  if (!browser) {
    callback(true);
    return () => {};
  }

  const unsubscribe = networkStatus.subscribe((state) => {
    callback(state.isOnline);
  });

  return unsubscribe;
}
