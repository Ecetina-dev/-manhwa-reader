/**
 * Rate Limiter Service
 *
 * Simple in-memory rate limiter for API endpoints
 * In production, use Redis or similar for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default configurations
export const CONFIGS: Record<string, RateLimitConfig> = {
  // Strict endpoints (login, register, admin)
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Upload endpoints (slower)
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
  // Standard pages
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
};

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval - remove expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Get client identifier (IP + user agent)
 */
export function getClientId(request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  // Create a simple hash
  const raw = `${ip}:${userAgent}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `rl_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if request is within rate limit
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  clientId: string,
  endpointType: keyof typeof CONFIGS = "standard",
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = CONFIGS[endpointType];
  const now = Date.now();
  const key = `${clientId}:${endpointType}`;

  let entry = rateLimitStore.get(key);

  // If no entry or expired, create new
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if allowed
  const remaining = config.maxRequests - entry.count;
  const resetIn = Math.max(0, entry.resetTime - now);

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    };
  }

  // Increment counter
  entry.count++;

  return {
    allowed: true,
    remaining: Math.max(0, remaining),
    resetIn,
  };
}

/**
 * Determine endpoint type from URL
 */
export function getEndpointType(url: string): keyof typeof CONFIGS {
  if (url.includes("/api/admin/auth") || url.includes("/login")) {
    return "strict";
  }
  if (
    url.includes("/upload") ||
    (url.includes("/api/admin/") && url.includes("/pages"))
  ) {
    return "upload";
  }
  if (
    url.includes("/api/") &&
    (url.includes("/search") || url.includes("/browse"))
  ) {
    return "search";
  }
  if (url.startsWith("/api/")) {
    return "api";
  }
  return "standard";
}

/**
 * Rate limit middleware for SvelteKit hooks
 */
export function rateLimitRequest(request: Request): {
  success: boolean;
  error?: string;
} {
  const clientId = getClientId(request);
  const endpointType = getEndpointType(request.url);

  const result = checkRateLimit(clientId, endpointType);

  if (!result.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${Math.ceil(result.resetIn / 1000)} seconds.`,
    };
  }

  return { success: true };
}
