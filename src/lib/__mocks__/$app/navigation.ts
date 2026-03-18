// Mock for $app/navigation in Vitest
export const goto = () => Promise.resolve();
export const replaceState = () => Promise.resolve();
export const pushState = () => Promise.resolve();
export const onNavigate = () => {};
export const afterNavigate = () => {};
export const beforeNavigate = () => {};
export const invalidate = () => Promise.resolve();
export const invalidateAll = () => Promise.resolve();
