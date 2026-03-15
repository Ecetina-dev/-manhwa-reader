import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'ManHau - Lector de Manga, Manhwa y Comics',
				short_name: 'ManHau',
				description: 'Lector de manga online con soporte offline. Lee tus capítulos favoritos sin conexión.',
				start_url: '/',
				display: 'standalone',
				background_color: '#0a0a0a',
				theme_color: '#6366f1',
				categories: ['entertainment', 'books'],
				orientation: 'portrait-primary',
				icons: [
					{
						src: '/icons/icon.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/icons/icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/icons/icon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
				// Runtime caching strategies
				runtimeCaching: [
					// MangaDex Images - CacheFirst with long TTL
					{
						urlPattern: /^https:\/\/uploads\.mangadex\.org\/data\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'mangadex-images',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// MangaDex Covers - CacheFirst
					{
						urlPattern: /^https:\/\/uploads\.mangadex\.org\/covers\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'mangadex-covers',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					// MangaDex API - NetworkFirst with cache fallback
					{
						urlPattern: /^https:\/\/api\.mangadex\.org\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'mangadex-api',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 1 // 1 hour
							},
							cacheableResponse: {
								statuses: [0, 200]
							},
							// Use cache when network fails
							networkTimeoutSeconds: 5
						}
					},
					// At-home server (chapter pages) - StaleWhileRevalidate
					{
						urlPattern: /^https:\/\/at-home\.server\.mangadex\.org\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'mangadex-chapters',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			// Service worker configuration
			devOptions: {
				enabled: true,
				navigateFallback: '/'
			}
		})
	]
});
