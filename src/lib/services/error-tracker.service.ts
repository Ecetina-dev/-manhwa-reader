/**
 * Error Tracking Service
 * Integración con Sentry para monitoreo de errores
 * 
 * @example
 * import { errorTracker } from '$lib/services/error-tracker';
 * 
 * // Inicializar
 * errorTracker.init('https://xxx@sentry.io/xxx');
 * 
 * // Capturar error
 * errorTracker.captureError(new Error('Something went wrong'));
 * 
 * // Capture message
 * errorTracker.captureMessage('User logged in');
 */

import { browser } from '$app/environment';

/**
 * Error Tracker Service using Sentry
 */
class ErrorTrackerService {
	private initialized = false;
	private dsn = '';

	/**
	 * Initialize Sentry
	 */
	init(dsn: string): void {
		if (!browser || this.initialized) return;
		
		this.dsn = dsn;
		
		// Check if Sentry is available
		if (typeof window !== 'undefined' && 'Sentry' in window) {
			const sentry = (window as unknown as { Sentry: unknown }).Sentry;
			
			if (sentry && typeof sentry === 'object' && 'init' in sentry) {
				(sentry as { init: (config: Record<string, unknown>) => void }).init({
					dsn: this.dsn,
					environment: import.meta.env.DEV ? 'development' : 'production',
					release: `manhau@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
					integrations: [
						// Add browser integrations here
					],
					beforeSend(event) {
						// Filter out non-critical errors in development
						if (import.meta.env.DEV) {
							return null;
						}
						return event;
					},
					// Sample rate: 100% in dev, 10% in prod
					sampleRate: import.meta.env.DEV ? 1.0 : 0.1
				});
				
				this.initialized = true;
			}
		}
	}

	/**
	 * Capture an error
	 */
	captureError(error: Error, context?: Record<string, unknown>): void {
		if (!browser || !this.initialized) {
			// Fallback: log to console in dev
			if (import.meta.env.DEV) {
				console.error('[ErrorTracker]', error, context);
			}
			return;
		}

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'captureException' in sentry) {
			(sentry as { captureException: (error: Error, context?: Record<string, unknown>) => void }).captureException(error, {
				extra: context
			});
		}
	}

	/**
	 * Capture a message
	 */
	captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
		if (!browser || !this.initialized) return;

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'captureMessage' in sentry) {
			(sentry as { captureMessage: (message: string, level?: string) => void }).captureMessage(message, level);
		}
	}

	/**
	 * Set user context
	 */
	setUser(userId: string, email?: string): void {
		if (!browser || !this.initialized) return;

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'setUser' in sentry) {
			(sentry as { setUser: (user: { id: string; email?: string }) => void }).setUser({
				id: userId,
				email
			});
		}
	}

	/**
	 * Clear user context (on logout)
	 */
	clearUser(): void {
		if (!browser || !this.initialized) return;

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'setUser' in sentry) {
			(sentry as { setUser: () => void }).setUser();
		}
	}

	/**
	 * Add breadcrumb for debugging
	 */
	addBreadcrumb(message: string, category: string = 'action', level: 'info' | 'warning' | 'error' = 'info'): void {
		if (!browser || !this.initialized) return;

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'addBreadcrumb' in sentry) {
			(sentry as { addBreadcrumb: (breadcrumb: { message: string; category: string; level: string }) => void }).addBreadcrumb({
				message,
				category,
				level
			});
		}
	}

	/**
	 * Set tag for filtering in Sentry
	 */
	setTag(key: string, value: string): void {
		if (!browser || !this.initialized) return;

		const sentry = (window as unknown as { Sentry: unknown }).Sentry;
		if (sentry && 'setTag' in sentry) {
			(sentry as { setTag: (key: string, value: string) => void }).setTag(key, value);
		}
	}
}

export const errorTracker = new ErrorTrackerService();

// TypeScript declarations
declare global {
	interface Window {
		Sentry: unknown;
	}
}
