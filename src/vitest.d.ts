/// <reference types="vitest" />
import type { Assertion, AsymmetricMatchersContaining } from "vitest";

declare global {
  namespace Vi {
    interface Matchers<R> {}
  }
}

export {};
