<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { getChapterPages, getOptimizedImageUrl, getCachedImageUrl, isChapterAvailableOffline } from '$lib/mangadex';
  import { readingStore } from '$lib/stores/reading';
  import { cacheImageService } from '$lib/services/cache-image.service';
  import { isOnline } from '$lib/services/network-status.service';
  import type { MangaDexPage } from '$lib/types';
  
  let pages: MangaDexPage[] = $state([]);
  let cachedUrls: Map<number, string> = $state(new Map());
  let loading = $state(true);
  let currentPage = $state(0);
  let mode: 'vertical' | 'horizontal' = $state('vertical');
  let isOfflineMode = $state(false);
  let chapterNotCached = $state(false);
  
  const serieId = $derived($page.params.id ?? '');
  const chapterId = $derived($page.params.chapter ?? '');
  
  async function loadPages() {
    if (!chapterId) return;
    
    loading = true;
    isOfflineMode = !isOnline();
    
    try {
      // Check if chapter is available offline
      const cached = await isChapterAvailableOffline(chapterId);
      chapterNotCached = !cached && !isOnline();
      
      // Load pages (now async)
      const chapterPages = await getChapterPages(chapterId);
      pages = chapterPages;
      
      // Load cached URLs for images
      cachedUrls = new Map();
      for (let i = 0; i < pages.length; i++) {
        const cachedUrl = await getCachedImageUrl(pages[i].url);
        cachedUrls.set(i, cachedUrl);
      }
      
      // Get saved progress (async now)
      const savedProgress = await readingStore.getProgress(chapterId);
      if (savedProgress && savedProgress.chapterId === chapterId) {
        currentPage = savedProgress.page;
      }
      
      // Preload adjacent pages
      prefetchAdjacent();
    } catch (e) {
      console.error('Failed to load pages', e);
    } finally {
      loading = false;
    }
  }
  
  async function saveProgress() {
    await readingStore.updateProgress(serieId, chapterId, currentPage);
  }
  
  function nextPage() {
    if (currentPage < pages.length - 1) {
      currentPage++;
      saveProgress();
      prefetchAdjacent();
    }
  }
  
  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      saveProgress();
      prefetchAdjacent();
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      prevPage();
    }
  }
  
  async function prefetchAdjacent() {
    const next = currentPage + 1;
    const prev = currentPage - 1;
    
    // Preload next page
    if (next < pages.length) {
      const url = await getCachedImageUrl(pages[next].url);
      cachedUrls.set(next, url);
      cachedUrls = cachedUrls; // Trigger reactivity
    }
    
    // Preload previous page
    if (prev >= 0) {
      const url = await getCachedImageUrl(pages[prev].url);
      cachedUrls.set(prev, url);
      cachedUrls = cachedUrls;
    }
  }
  
  function getImageUrl(index: number): string {
    return cachedUrls.get(index) || getOptimizedImageUrl(pages[index]?.url || '');
  }
  
  onMount(() => {
    loadPages();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<Header>
  <!-- Offline Warning -->
  {#if isOfflineMode && chapterNotCached}
    <div class="bg-amber-500 text-white px-4 py-2 text-center">
      ⚠️ Este capítulo no está disponible offline
    </div>
  {/if}
  
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if pages.length > 0}
    <div class="fixed bottom-4 right-4 flex gap-2 z-50">
      <button 
        onclick={() => mode = mode === 'vertical' ? 'horizontal' : 'vertical'}
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        {mode === 'vertical' ? '📱 Vertical' : '↔️ Horizontal'}
      </button>
    </div>
    
    <div class="flex items-center justify-center gap-4 py-2 bg-gray-900 sticky top-14 z-40">
      <button 
        onclick={prevPage}
        disabled={currentPage === 0}
        class="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Prev
      </button>
      <span class="text-white">
        Page {currentPage + 1} / {pages.length}
      </span>
      <button 
        onclick={nextPage}
        disabled={currentPage === pages.length - 1}
        class="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
      >
        Next →
      </button>
    </div>
    
    <div class={mode === 'vertical' ? 'flex flex-col items-center' : 'flex flex-row overflow-x-auto'}>
      {#each pages as pageData, i (i)}
        <img 
          src={getImageUrl(i)}
          alt="Page {i + 1}"
          loading={i === currentPage ? 'eager' : 'lazy'}
          fetchpriority={i === currentPage ? 'high' : 'low'}
          class="{mode === 'vertical' ? 'w-full max-w-2xl' : 'h-screen w-auto'} object-contain"
          class:opacity-50={Math.abs(i - currentPage) > 1}
        />
      {/each}
    </div>
  {/if}
</Header>
