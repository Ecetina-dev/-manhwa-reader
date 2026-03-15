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
  let error = $state('');
  
  const serieId = $derived($page.params.id ?? '');
  const chapterId = $derived($page.params.chapter ?? '');
  
  async function loadPages() {
    if (!chapterId) return;
    
    loading = true;
    error = '';
    isOfflineMode = !isOnline();
    
    try {
      // Check if chapter is available offline
      const cached = await isChapterAvailableOffline(chapterId);
      chapterNotCached = !cached && !isOnline();
      
      // Load pages
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
      error = 'Failed to load chapter. Please try again.';
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
  <!-- Loading State -->
  {#if loading}
    <div class="flex flex-col items-center justify-center py-32">
      <div class="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-[var(--color-text-muted)]">Loading chapter...</p>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="text-center py-32">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p class="text-red-500 text-lg mb-4">{error}</p>
      <button onclick={loadPages} class="btn-primary">
        Try Again
      </button>
    </div>
  
  <!-- Empty State -->
  {:else if pages.length === 0}
    <div class="text-center py-32">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
        <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-[var(--color-text-muted)] text-lg">No pages found</p>
    </div>
  
  <!-- Reader -->
  {:else}
    <!-- Offline Warning -->
    {#if isOfflineMode && chapterNotCached}
      <div class="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-center">
        <span class="text-amber-500 text-sm">
          ⚠️ You're offline and this chapter isn't cached. Some images may not load.
        </span>
      </div>
    {/if}
    
    <!-- Controls -->
    <div class="sticky top-14 z-40 bg-[var(--color-bg-secondary)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Navigation -->
        <div class="flex items-center gap-3">
          <button 
            onclick={prevPage}
            disabled={currentPage === 0}
            class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Previous page"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span class="text-white font-medium min-w-[100px] text-center">
            {currentPage + 1} <span class="text-[var(--color-text-muted)]">/</span> {pages.length}
          </span>
          
          <button 
            onclick={nextPage}
            disabled={currentPage === pages.length - 1}
            class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Next page"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <!-- Mode Toggle -->
        <button 
          onclick={() => mode = mode === 'vertical' ? 'horizontal' : 'vertical'}
          class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] transition-all"
          title="Toggle reading mode"
        >
          {#if mode === 'vertical'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Pages -->
    <div class={mode === 'vertical' ? 'flex flex-col items-center' : 'flex flex-row overflow-x-auto snap-x snap-mandatory'}>
      {#each pages as pageData, i (i)}
        <img 
          src={getImageUrl(i)}
          alt="Page {i + 1}"
          loading={i === currentPage ? 'eager' : 'lazy'}
          fetchpriority={i === currentPage ? 'high' : 'low'}
          class="{mode === 'vertical' ? 'w-full max-w-3xl' : 'h-screen w-auto snap-center'} object-contain bg-black"
          class:opacity-0={i !== currentPage}
          class:fixed={i !== currentPage}
          class:pointer-events-none={i !== currentPage}
        />
      {/each}
    </div>
    
    <!-- Bottom Navigation -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-card)]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[var(--color-border)] shadow-lg">
      <button 
        onclick={prevPage}
        disabled={currentPage === 0}
        class="text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <span class="text-white font-medium">
        {currentPage + 1} / {pages.length}
      </span>
      
      <button 
        onclick={nextPage}
        disabled={currentPage === pages.length - 1}
        class="text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  {/if}
</Header>

<!-- Spacer for fixed bottom nav -->
<div class="h-24"></div>
