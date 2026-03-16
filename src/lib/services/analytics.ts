/**
 * Analytics Service
 * 
 * Google Analytics 4 integration for tracking user behavior
 */

import { browser } from '$app/environment';

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}

interface PageViewData {
  page_title: string;
  page_location: string;
  page_path: string;
}

// Google Analytics 4 Measurement ID (set via environment variable)
const GA_MEASUREMENT_ID = typeof import.meta !== 'undefined' 
  ? (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || null
  : null;

let initialized = false;

/**
 * Initialize Google Analytics
 */
export function initAnalytics(): void {
  if (!browser || initialized) return;
  
  // Skip if no GA ID configured
  if (!GA_MEASUREMENT_ID) {
    console.warn('⚠️ Google Analytics not configured. Set VITE_GA_MEASUREMENT_ID environment variable.');
    return;
  }

  // Add GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  
  // Define gtag function
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false // Manual page view tracking
  });

  initialized = true;
  console.log('📊 Google Analytics initialized');
}

/**
 * Track page view
 */
export function trackPageView(data: PageViewData): void {
  if (!browser) return;
  
  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: data.page_title,
      page_location: data.page_location,
      page_path: data.page_path
    });
  }
}

/**
 * Track custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!browser) return;
  
  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', event.name, event.params || {});
  }
}

/**
 * Track manga view
 */
export function trackMangaView(mangaId: string, mangaTitle: string): void {
  trackEvent({
    name: 'manga_view',
    params: {
      manga_id: mangaId,
      manga_title: mangaTitle
    }
  });
}

/**
 * Track chapter read
 */
export function trackChapterRead(mangaId: string, mangaTitle: string, chapterNumber: string): void {
  trackEvent({
    name: 'chapter_read',
    params: {
      manga_id: mangaId,
      manga_title: mangaTitle,
      chapter_number: chapterNumber
    }
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string, resultsCount: number): void {
  trackEvent({
    name: 'search',
    params: {
      search_term: searchTerm,
      results_count: resultsCount
    }
  });
}

/**
 * Track favorite toggle
 */
export function trackFavorite(mangaId: string, action: 'add' | 'remove'): void {
  trackEvent({
    name: action === 'add' ? 'add_to_favorite' : 'remove_from_favorite',
    params: {
      manga_id: mangaId
    }
  });
}

/**
 * Track rating
 */
export function trackRating(mangaId: string, rating: number): void {
  trackEvent({
    name: 'rate_manga',
    params: {
      manga_id: mangaId,
      rating: rating
    }
  });
}

/**
 * Track comment posted
 */
export function trackComment(mangaId: string): void {
  trackEvent({
    name: 'post_comment',
    params: {
      manga_id: mangaId
    }
  });
}

/**
 * Track error (non-fatal)
 */
export function trackError(errorMessage: string, errorStack?: string): void {
  trackEvent({
    name: 'exception',
    params: {
      description: errorMessage,
      fatal: false
    }
  });
  
  // Also log to console in development
  if (typeof window !== 'undefined' && !(window as any).__gta_initialized) {
    console.error('[Analytics Error]', errorMessage, errorStack);
  }
}

/**
 * Set user property
 */
export function setUserProperty(name: string, value: string): void {
  if (!browser) return;
  
  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('set', 'user_properties', {
      [name]: value
    });
  }
}

/**
 * Track timing
 */
export function trackTiming(category: string, variable: string, value: number, label?: string): void {
  trackEvent({
    name: 'timing_complete',
    params: {
      name: variable,
      value: value,
      event_category: category,
      event_label: label
    }
  });
}
