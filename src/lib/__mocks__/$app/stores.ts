// Mock for $app/stores in Vitest
import { readable } from "svelte/store";

export const page = readable({
  url: new URL("http://localhost"),
  params: {},
  route: { id: null },
  data: {},
  status: 200,
  error: null,
  loading: false,
});

export const navigating = readable(null);
export const goto = () => Promise.resolve();
export const replaceState = () => Promise.resolve();
export const pushState = () => Promise.resolve();
export const onNavigate = () => {};
export const afterNavigate = () => {};
