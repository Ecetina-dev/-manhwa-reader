// Mock for $app/environment
export const browser = true;
export const dev = true;
export const building = false;

export function augmentWithGlobs(obj: unknown, globs: string[]): unknown {
  return obj;
}
