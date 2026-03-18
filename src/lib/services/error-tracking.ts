/**
 * Error Tracking Service
 *
 * Client-side error handling and reporting
 */

import { browser } from "$app/environment";
import { trackError } from "./analytics";

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Get user ID from localStorage
 */
function getUserId(): string | undefined {
  if (!browser) return undefined;
  return localStorage.getItem("manhau_user_id") || undefined;
}

/**
 * Global error handler for uncaught errors
 */
export function initErrorTracking(): void {
  if (!browser) return;

  // Handle uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    const errorReport: ErrorReport = {
      message: String(message),
      stack: error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: getUserId(),
    };

    // Log to console in development
    console.error("❌ Uncaught Error:", errorReport);

    // Send to analytics
    trackError(errorReport.message, errorReport.stack);

    // Return false to let default error handler run
    return false;
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    const errorReport: ErrorReport = {
      message: reason?.message || String(reason),
      stack: reason?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      userId: getUserId(),
    };

    console.error("❌ Unhandled Promise Rejection:", errorReport);
    trackError(errorReport.message, errorReport.stack);
  };

  console.log("🔍 Error tracking initialized");
}

/**
 * Create error boundary state
 */
export function createErrorBoundary(): ErrorBoundaryState {
  return {
    hasError: false,
  };
}

/**
 * Handle component error
 */
export function handleComponentError(
  error: Error,
  componentStack?: string,
): void {
  const errorReport: ErrorReport = {
    message: error.message,
    stack: componentStack || error.stack,
    url: browser ? window.location.href : "server",
    timestamp: new Date().toISOString(),
    userId: getUserId(),
  };

  console.error("❌ Component Error:", errorReport);
  trackError(errorReport.message, errorReport.stack);
}

/**
 * Report API error
 */
export function reportApiError(
  endpoint: string,
  status: number,
  message: string,
): void {
  const errorReport: ErrorReport = {
    message: `API Error [${endpoint}]: ${status} - ${message}`,
    url: browser ? window.location.href : "server",
    timestamp: new Date().toISOString(),
  };

  console.error("❌ API Error:", errorReport);

  // Don't track all API errors to analytics (they can be spammy)
  // Only track 5xx errors
  if (status >= 500) {
    trackError(errorReport.message);
  }
}

/**
 * Log performance issue
 */
export function logPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
): void {
  if (value > threshold) {
    console.warn(
      `⚠️ Performance issue: ${metric} (${value}ms) exceeds threshold (${threshold}ms)`,
    );
  }
}

/**
 * Track slow network request
 */
export function trackSlowRequest(
  url: string,
  duration: number,
  threshold: number = 5000,
): void {
  if (duration > threshold) {
    const message = `Slow request: ${url} took ${duration}ms`;
    console.warn(`🐌 ${message}`);
    trackError(message);
  }
}
