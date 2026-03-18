/**
 * Input Sanitization Service
 *
 * Sanitizes user inputs to prevent XSS and injection attacks
 */

/**
 * Strip HTML tags from string
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Escape HTML entities
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize string for SQL (basic - use parameterized queries!)
 */
export function sanitizeSql(input: string): string {
  // This is just a fallback - ALWAYS use parameterized queries!
  return input.replace(/['";\\]/g, "");
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    // Only allow http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }
    return input;
  } catch {
    return "";
  }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(input: string): string {
  return input
    .trim()
    .substring(0, 100) // Limit length
    .replace(/[<>\"'&]/g, ""); // Remove dangerous chars
}

/**
 * Sanitize manga title/description
 */
export function sanitizeMangaContent(input: string): string {
  return input
    .trim()
    .substring(0, 5000) // Max 5000 chars
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
    .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
    .replace(/javascript:/gi, ""); // Remove javascript: URLs
}

/**
 * Sanitize comment content
 */
export function sanitizeComment(input: string): string {
  return input
    .trim()
    .substring(0, 2000) // Max 2000 chars
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/https?:\/\/[^ ]+\.(jpg|jpeg|png|gif|webp)/gi, "[image]"); // Optionally strip image URLs
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate rating (1-5)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Validate manga ID
 */
export function isValidMangaId(id: any): boolean {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && num < 1000000;
}

/**
 * Validate chapter ID
 */
export function isValidChapterId(id: any): boolean {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && num < 10000000;
}

/**
 * Sanitize object recursively (for API inputs)
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  rules: Record<keyof T, (value: any) => any>,
): Partial<T> {
  const sanitized: Partial<T> = {};

  for (const [key, sanitizer] of Object.entries(rules)) {
    if (key in obj) {
      try {
        (sanitized as any)[key] = sanitizer(obj[key]);
      } catch {
        // If sanitizer fails, use stripHtml as fallback
        (sanitized as any)[key] = stripHtml(String(obj[key]));
      }
    }
  }

  return sanitized;
}
