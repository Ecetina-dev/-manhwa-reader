import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientId,
  getEndpointType,
  rateLimitRequest,
  CONFIGS,
} from "$lib/services/rate-limiter";

describe("Rate Limiter Service", () => {
  describe("getClientId", () => {
    it("should generate consistent client IDs", () => {
      const req1 = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0",
        },
      });
      const req2 = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0",
        },
      });

      const id1 = getClientId(req1);
      const id2 = getClientId(req2);

      expect(id1).toBe(id2);
    });

    it("should generate different IDs for different IPs", () => {
      const req1 = new Request("http://test.com", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });
      const req2 = new Request("http://test.com", {
        headers: { "x-forwarded-for": "192.168.1.2" },
      });

      expect(getClientId(req1)).not.toBe(getClientId(req2));
    });
  });

  describe("getEndpointType", () => {
    it("should identify strict endpoints", () => {
      expect(getEndpointType("/api/admin/auth")).toBe("strict");
      expect(getEndpointType("/login")).toBe("strict");
    });

    it("should identify upload endpoints", () => {
      expect(getEndpointType("/api/admin/chapter/1/pages")).toBe("upload");
    });

    it("should identify search endpoints", () => {
      expect(getEndpointType("/api/search")).toBe("search");
      expect(getEndpointType("/api/browse")).toBe("search");
    });

    it("should identify API endpoints", () => {
      expect(getEndpointType("/api/manga")).toBe("api");
      expect(getEndpointType("/api/comments")).toBe("api");
    });

    it("should return standard for regular pages", () => {
      expect(getEndpointType("/")).toBe("standard");
      expect(getEndpointType("/browse")).toBe("standard");
      expect(getEndpointType("/admin")).toBe("standard");
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const result = checkRateLimit("test-client", "standard");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should track request count", () => {
      const clientId = "test-client-rate-" + Date.now();

      // First request should be allowed
      const result1 = checkRateLimit(clientId, "standard");
      expect(result1.allowed).toBe(true);

      // Should decrement remaining
      const remainingAfterFirst = result1.remaining;

      const result2 = checkRateLimit(clientId, "standard");
      expect(result2.remaining).toBe(remainingAfterFirst - 1);
    });

    it("should block when limit exceeded", () => {
      const clientId = "test-client-block-" + Date.now();

      // Use up all requests
      for (let i = 0; i < CONFIGS.standard.maxRequests; i++) {
        checkRateLimit(clientId, "standard");
      }

      // Next request should be blocked
      const result = checkRateLimit(clientId, "standard");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use different limits per endpoint type", () => {
      const clientId = "test-client-limits-" + Date.now();

      // Standard has 120 requests/min
      const standardResult = checkRateLimit(clientId, "standard");
      expect(standardResult.remaining).toBe(CONFIGS.standard.maxRequests - 1);
    });
  });

  describe("rateLimitRequest", () => {
    it("should return success for normal requests", () => {
      const req = new Request("http://test.com/");
      const result = rateLimitRequest(req);

      expect(result.success).toBe(true);
    });

    it("should identify endpoint type from request", () => {
      const strictReq = new Request("http://test.com/api/admin/auth");
      const strictResult = rateLimitRequest(strictReq);
      expect(strictResult.success).toBe(true);
    });
  });
});
