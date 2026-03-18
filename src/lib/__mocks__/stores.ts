// Mock for $app/stores
import { writable, readable } from "svelte/store";

export const page = readable({
  url: new URL("http://localhost"),
  params: {},
  route: {},
});
export const navigating = readable(null);
export const updated = {
  check: () => Promise.resolve(false),
  subscribe: (fn: (value: boolean) => void) => fn(false),
};
export const base = writable("");
