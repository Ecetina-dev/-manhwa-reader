import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
