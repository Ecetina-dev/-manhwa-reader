/**
 * Rate Limiter Service
 * Limits the number of requests per second to avoid API rate limiting
 */

export interface RateLimiterConfig {
  requestsPerSecond: number;
}

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  fn: () => Promise<unknown>;
}

/**
 * Creates a rate limiter that throttles requests to a maximum rate
 */
export function createRateLimiter(
  config: RateLimiterConfig = { requestsPerSecond: 1 },
) {
  const { requestsPerSecond } = config;
  const delay = 1000 / requestsPerSecond;

  let queue: QueuedRequest[] = [];
  let isProcessing = false;
  let lastRequestTime = 0;

  /**
   * Process the next request in the queue
   */
  async function processQueue(): Promise<void> {
    if (queue.length === 0) {
      isProcessing = false;
      return;
    }

    isProcessing = true;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < delay) {
      await new Promise((resolve) =>
        setTimeout(resolve, delay - timeSinceLastRequest),
      );
    }

    const request = queue.shift();
    if (request) {
      lastRequestTime = Date.now();
      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error as Error);
      }
    }

    // Process next
    processQueue();
  }

  /**
   * Throttle a function call to respect rate limits
   */
  function throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      if (!isProcessing) {
        processQueue();
      }
    });
  }

  /**
   * Reset the rate limiter (for testing)
   */
  function reset(): void {
    queue = [];
    isProcessing = false;
    lastRequestTime = 0;
  }

  /**
   * Get current queue length (for debugging)
   */
  function getQueueLength(): number {
    return queue.length;
  }

  return {
    throttle,
    reset,
    getQueueLength,
  };
}

/**
 * Singleton rate limiter instance with 1 request per second (MangaDex API limit)
 */
export const rateLimiter = createRateLimiter({ requestsPerSecond: 1 });

/**
 * Helper to throttle any async function
 */
export async function withThrottle<T>(
  fn: () => Promise<T>,
  limiter = rateLimiter,
): Promise<T> {
  return limiter.throttle(fn);
}
