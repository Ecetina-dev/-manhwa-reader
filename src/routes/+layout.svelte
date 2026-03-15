<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { offlineStore } from '$lib/stores/offline';
	import { readingStore } from '$lib/stores/reading';

	let { children } = $props();

	let isOnline = $state(true);
	let showUpdateToast = $state(false);

	onMount(() => {
		if (!browser) return;

		// Initialize reading store
		readingStore.init();

		// Update cached chapters
		offlineStore.updateCachedChapters();
		
		// Check network status periodically
		const checkOnline = () => {
			isOnline = navigator.onLine;
		};

		window.addEventListener('online', checkOnline);
		window.addEventListener('offline', checkOnline);
		checkOnline();

		// PWA update notification
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration().then((registration) => {
				if (registration?.waiting) {
					showUpdateToast = true;
				}
			});
		}

		// Cleanup
		return () => {
			window.removeEventListener('online', checkOnline);
			window.removeEventListener('offline', checkOnline);
		};
	});

	async function refreshApp() {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration?.waiting) {
				registration.waiting.postMessage('skipWaiting');
			}
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Offline Indicator -->
{#if !isOnline}
	<div class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium">
		<span>📡 Modo Offline - Algunas funciones pueden estar limitadas</span>
	</div>
{/if}

<!-- Update Toast -->
{#if showUpdateToast}
	<div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg">
		<div class="flex items-center justify-between gap-4">
			<span class="text-sm">Nueva versión disponible</span>
			<button 
				onclick={refreshApp}
				class="bg-white text-purple-600 px-4 py-1.5 rounded font-medium text-sm hover:bg-purple-50 transition-colors"
			>
				Actualizar
			</button>
		</div>
	</div>
{/if}

<!-- Main Content -->
<div class:mt-8={!isOnline}>
	{@render children()}
</div>
