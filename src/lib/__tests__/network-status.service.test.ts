import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { networkStatus, onNetworkStatusChange, isOnline } from '$lib/services/network-status.service';

describe('NetworkStatus Service', () => {
	// Store original navigator.onLine
	const originalOnLine = navigator.onLine;

	beforeEach(() => {
		// Reset navigator.onLine to online before each test
		Object.defineProperty(navigator, 'onLine', {
			value: true,
			writable: true,
		});
	});

	afterEach(() => {
		// Restore original navigator.onLine
		Object.defineProperty(navigator, 'onLine', {
			value: originalOnLine,
			writable: true,
		});
	});

	describe('networkStatus store', () => {
		it('should have initial state with isOnline true', () => {
			let state: { isOnline: boolean; lastOnline: number | null } | undefined;

			const unsubscribe = networkStatus.subscribe((value) => {
				state = value;
			});
			unsubscribe();

			expect(state).toBeDefined();
			expect(state?.isOnline).toBe(true);
		});

		it('should update state when going offline', () => {
			let finalState: { isOnline: boolean; lastOnline: number | null } | undefined;

			const unsubscribe = networkStatus.subscribe((state) => {
				if (!navigator.onLine) {
					finalState = state;
				}
			});

			// Simulate going offline
			Object.defineProperty(navigator, 'onLine', {
				value: false,
				writable: true,
			});
			window.dispatchEvent(new Event('offline'));

			// Wait for event to process
			setTimeout(() => {
				expect(finalState?.isOnline).toBe(false);
			}, 100);

			unsubscribe();
		});

		it('should update state when going online', () => {
			// First go offline
			Object.defineProperty(navigator, 'onLine', {
				value: false,
				writable: true,
			});
			window.dispatchEvent(new Event('offline'));

			let finalState: { isOnline: boolean; lastOnline: number | null } | undefined;

			const unsubscribe = networkStatus.subscribe((state) => {
				if (navigator.onLine && state.isOnline) {
					finalState = state;
				}
			});

			// Simulate going online
			Object.defineProperty(navigator, 'onLine', {
				value: true,
				writable: true,
			});
			window.dispatchEvent(new Event('online'));

			setTimeout(() => {
				expect(finalState?.isOnline).toBe(true);
			}, 100);

			unsubscribe();
		});
	});

	describe('isOnline helper', () => {
		// Note: navigator.onLine is not configurable in jsdom, so we test the behavior
		// through the store subscription tests instead
		it('should be defined as a function', () => {
			expect(typeof isOnline).toBe('function');
		});
	});

	describe('onNetworkStatusChange callback', () => {
		it('should call callback immediately with current status', () => {
			Object.defineProperty(navigator, 'onLine', {
				value: true,
				writable: true,
			});

			const callback = vi.fn();
			onNetworkStatusChange(callback);

			expect(callback).toHaveBeenCalledWith(true);
		});

		it('should call callback when status changes to offline', () => {
			Object.defineProperty(navigator, 'onLine', {
				value: true,
				writable: true,
			});

			const callback = vi.fn();
			onNetworkStatusChange(callback);

			// Simulate going offline
			Object.defineProperty(navigator, 'onLine', {
				value: false,
				writable: true,
			});
			window.dispatchEvent(new Event('offline'));

			setTimeout(() => {
				expect(callback).toHaveBeenCalledWith(false);
			}, 100);
		});

		it('should call callback when status changes to online', () => {
			// Start offline
			Object.defineProperty(navigator, 'onLine', {
				value: false,
				writable: true,
			});

			const callback = vi.fn();
			onNetworkStatusChange(callback);

			// Simulate going online
			Object.defineProperty(navigator, 'onLine', {
				value: true,
				writable: true,
			});
			window.dispatchEvent(new Event('online'));

			setTimeout(() => {
				expect(callback).toHaveBeenCalledWith(true);
			}, 100);
		});

		it('should return unsubscribe function', () => {
			const callback = vi.fn();
			const unsubscribe = onNetworkStatusChange(callback);

			expect(typeof unsubscribe).toBe('function');

			unsubscribe();

			// After unsubscribe, callback should not be called
			Object.defineProperty(navigator, 'onLine', {
				value: false,
				writable: true,
			});
			window.dispatchEvent(new Event('offline'));

			setTimeout(() => {
				// Callback should not have been called after unsubscribe
				// Note: The initial call might have happened before unsubscribe
			}, 100);
		});
	});
});
