import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/svelte";

// Mock $app/environment
vi.mock("$app/environment", () => ({
  browser: true,
  dev: true,
  building: false,
}));

// Mock $app/stores
vi.mock("$app/stores", () => ({
  page: {
    subscribe: (fn: Function) => {
      fn({ url: new URL("http://localhost"), params: {}, route: { id: null }, data: {}, status: 200, error: null, loading: false });
      return () => {};
    },
  },
  navigating: { subscribe: (fn: Function) => { fn(null); return () => {}; } },
}));

// Mock $app/navigation
vi.mock("$app/navigation", () => ({
  goto: () => Promise.resolve(),
  replaceState: () => Promise.resolve(),
  pushState: () => Promise.resolve(),
  onNavigate: () => {},
  afterNavigate: () => {},
  beforeNavigate: () => {},
  invalidate: () => Promise.resolve(),
  invalidateAll: () => Promise.resolve(),
}));

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
