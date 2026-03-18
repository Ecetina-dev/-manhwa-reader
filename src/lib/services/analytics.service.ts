/**
 * Analytics Service
 * Integración con Google Analytics 4
 *
 * @example
 * import { analytics } from '$lib/services/analytics';
 *
 * // Track page view
 * analytics.pageview('/home', 'ManHau');
 *
 * // Track event
 * analytics.event('read', 'chapter_start', { chapterId: '123' });
 */

import { browser } from "$app/environment";

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PageView {
  page: string;
  title: string;
}

/**
 * Analytics Service for Google Analytics 4
 */
class AnalyticsService {
  private initialized = false;
  private measurementId = "G-XXXXXXXXXX"; // Replace with actual GA4 ID

  /**
   * Initialize GA4
   */
  init(measurementId?: string): void {
    if (!browser || this.initialized) return;

    if (measurementId) {
      this.measurementId = measurementId;
    }

    // Load GA4 script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", this.measurementId, {
      page_title: document.title,
      debug_mode: import.meta.env.DEV,
    });

    this.initialized = true;
  }

  /**
   * Track page view
   */
  pageview(page: string, title: string): void {
    if (!browser || !this.initialized) return;

    window.gtag("event", "page_view", {
      page_path: page,
      page_title: title,
    });
  }

  /**
   * Track custom event
   */
  event(
    category: string,
    action: string,
    params?: Record<string, unknown>,
  ): void {
    if (!browser || !this.initialized) return;

    window.gtag("event", action, {
      event_category: category,
      ...params,
    });
  }

  /**
   * Track reading progress
   */
  trackReading(serieId: string, chapterId: string, page: number): void {
    this.event("reading", "page_turn", {
      serie_id: serieId,
      chapter_id: chapterId,
      page_number: page,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultsCount: number): void {
    this.event("search", "search", {
      search_term: query,
      results_count: resultsCount,
    });
  }

  /**
   * Track offline usage
   */
  trackOffline(action: "enabled" | "cached_chapter" | "cached_image"): void {
    this.event("offline", action);
  }

  /**
   * Track PWA install
   */
  trackPWAInstall(): void {
    this.event("pwa", "install");
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.event("error", "exception", {
      description: error.message,
      fatal: false,
      context,
    });
  }
}

export const analytics = new AnalyticsService();

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
