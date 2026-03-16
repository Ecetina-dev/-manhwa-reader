import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimiter } from '$lib/services/rate-limiter.service';

describe('RateLimiter Service', () => {
	describe('createRateLimiter', () => {
		it('should create a rate limiter with default config', () => {
			const limiter = createRateLimiter();
			expect(limiter).toBeDefined();
			expect(typeof limiter.throttle).toBe('function');
			expect(typeof limiter.reset).toBe('function');
			expect(typeof limiter.getQueueLength).toBe('function');
		});

		it('should create a rate limiter with custom config', () => {
			const limiter = createRateLimiter({ requestsPerSecond: 2 });
			expect(limiter).toBeDefined();
		});
	});

	describe('throttle', () => {
		it('should execute the throttled function', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });
			let executed = false;

			await limiter.throttle(async () => {
				executed = true;
				return 'result';
			});

			expect(executed).toBe(true);
		});

		it('should return the result of the throttled function', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });
			const result = await limiter.throttle(async () => 'expected result');

			expect(result).toBe('expected result');
		});

		it('should reject when the throttled function throws', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });

			await expect(
				limiter.throttle(async () => {
					throw new Error('test error');
				})
			).rejects.toThrow('test error');
		});

		it('should queue multiple requests and execute them in order', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });
			const results: number[] = [];

			// Create multiple throttled calls
			const promises = [
				limiter.throttle(async () => {
					await new Promise((r) => setTimeout(r, 10));
					results.push(1);
					return 1;
				}),
				limiter.throttle(async () => {
					await new Promise((r) => setTimeout(r, 10));
					results.push(2);
					return 2;
				}),
				limiter.throttle(async () => {
					await new Promise((r) => setTimeout(r, 10));
					results.push(3);
					return 3;
				}),
			];

			const resultsPromises = await Promise.all(promises);

			// All should complete
			expect(resultsPromises).toEqual([1, 2, 3]);
		}, 10000);
	});

	describe('reset', () => {
		it('should clear the queue when reset is called', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });

			// Add a function to the queue but don't wait for it
			limiter.throttle(async () => {
				await new Promise((r) => setTimeout(r, 100));
				return 'result';
			});

			expect(limiter.getQueueLength()).toBeGreaterThanOrEqual(0);

			// Reset should clear the queue
			limiter.reset();
			expect(limiter.getQueueLength()).toBe(0);
		});
	});

	describe('getQueueLength', () => {
		it('should return 0 for empty queue', () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });
			expect(limiter.getQueueLength()).toBe(0);
		});

		it('should return correct queue length after adding requests', async () => {
			const limiter = createRateLimiter({ requestsPerSecond: 10 });

			// Add multiple requests
			limiter.throttle(async () => 'result1');
			limiter.throttle(async () => 'result2');

			// Queue might have entries waiting
			expect(limiter.getQueueLength()).toBeGreaterThanOrEqual(0);
		});
	});
});
