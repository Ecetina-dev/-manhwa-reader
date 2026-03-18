import { describe, it, expect } from "vitest";
import {
  stripHtml,
  escapeHtml,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeMangaContent,
  sanitizeComment,
  isValidEmail,
  isValidUrl,
  isValidRating,
  isValidMangaId,
  isValidChapterId,
} from "$lib/services/sanitizer";

describe("Sanitizer Service", () => {
  describe("stripHtml", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<p>Hello World</p>")).toBe("Hello World");
      expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
    });

    it("should handle strings without HTML", () => {
      expect(stripHtml("Plain text")).toBe("Plain text");
    });

    it("should handle nested tags", () => {
      expect(stripHtml("<div><p>Nested <span>text</span></p></div>")).toBe(
        "Nested text",
      );
    });
  });

  describe("escapeHtml", () => {
    it("should escape HTML entities", () => {
      expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
      expect(escapeHtml("A & B")).toBe("A &amp; B");
      expect(escapeHtml('"quotes"')).toBe("&quot;quotes&quot;");
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove dangerous characters", () => {
      expect(sanitizeFilename("file../name.jpg")).toBe("file_name.jpg");
      expect(sanitizeFilename("file<script>.jpg")).toBe("filescript.jpg");
    });

    it("should keep valid characters", () => {
      expect(sanitizeFilename("manga-cover-123.jpg")).toBe(
        "manga-cover-123.jpg",
      );
    });

    it("should limit length", () => {
      const longName = "a".repeat(300) + ".jpg";
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should trim and limit length", () => {
      expect(sanitizeSearchQuery("  one piece  ")).toBe("one piece");
      expect(sanitizeSearchQuery("a".repeat(200)).length).toBeLessThanOrEqual(
        100,
      );
    });

    it("should remove dangerous characters", () => {
      expect(sanitizeSearchQuery("<script>")).toBe("");
      expect(sanitizeSearchQuery('test"or"1=1')).toBe("testor1=1");
    });
  });

  describe("sanitizeMangaContent", () => {
    it("should remove scripts and event handlers", () => {
      const input =
        '<p>Description</p><script>evil()</script><img onerror="alert(1)">';
      const result = sanitizeMangaContent(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("onerror");
    });

    it("should limit length", () => {
      const long = "a".repeat(10000);
      expect(sanitizeMangaContent(long).length).toBeLessThanOrEqual(5000);
    });
  });

  describe("sanitizeComment", () => {
    it("should remove scripts", () => {
      const input = 'Nice chapter!<script>alert("xss")</script>';
      expect(sanitizeComment(input)).not.toContain("<script>");
    });

    it("should limit length", () => {
      const long = "a".repeat(5000);
      expect(sanitizeComment(long).length).toBeLessThanOrEqual(2000);
    });
  });

  describe("isValidEmail", () => {
    it("should validate email format", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.org")).toBe(true);
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("no@domain")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate URL format", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://test.org/path")).toBe(true);
      expect(isValidUrl("not-a-url")).toBe(false);
      expect(isValidUrl("ftp://invalid.com")).toBe(false);
    });
  });

  describe("isValidRating", () => {
    it("should validate rating 1-5", () => {
      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(3)).toBe(true);
      expect(isValidRating(5)).toBe(true);
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(6)).toBe(false);
      expect(isValidRating(3.5)).toBe(false);
      expect(isValidRating(-1)).toBe(false);
    });
  });

  describe("isValidMangaId", () => {
    it("should validate manga ID", () => {
      expect(isValidMangaId(1)).toBe(true);
      expect(isValidMangaId(1000)).toBe(true);
      expect(isValidMangaId(0)).toBe(false);
      expect(isValidMangaId(-1)).toBe(false);
      expect(isValidMangaId(1000000)).toBe(false);
      expect(isValidMangaId("abc")).toBe(false);
    });
  });

  describe("isValidChapterId", () => {
    it("should validate chapter ID", () => {
      expect(isValidChapterId(1)).toBe(true);
      expect(isValidChapterId(10000)).toBe(true);
      expect(isValidChapterId(0)).toBe(false);
      expect(isValidChapterId(10000000)).toBe(false);
    });
  });
});
