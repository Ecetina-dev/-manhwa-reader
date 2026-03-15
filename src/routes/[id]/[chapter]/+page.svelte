<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { getChapterPages, getOptimizedImageUrl } from '$lib/mangadex';
  import { readingStore } from '$lib/stores/reading';
  import type { MangaDexPage } from '$lib/types';
  
  let pages: MangaDexPage[] = $state([]);
  let loading = $state(true);
  let currentPage = $state(0);
  let mode: 'vertical' | 'horizontal' = $state('vertical');
  let loadingPages = $state<Set<number>>(new Set());
  
  const serieId = $derived($page.params.id);
  const chapterId = $derived($page.params.chapter);
  
  async function loadPages() {
    loading = true;
    try {
      pages = await getChapterPages(chapterId);
      
      const savedProgress = readingStore.getProgress(serieId);
      if (savedProgress && savedProgress.chapterId === chapterId) {
        currentPage = savedProgress.page;
      }
      
      prefetchAdjacent();
    } catch (e) {
      console.error('Failed to load pages', e);
    } finally {
      loading = false;
    }
  }
  
  function saveProgress() {
    readingStore.updateProgress(serieId, chapterId, currentPage);
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
  
  function prefetchAdjacent() {
    const next = currentPage + 1;
    const prev = currentPage - 1;
    
    if (next < pages.length && !loadingPages.has(next)) {
      const img = new Image();
      img.src = getOptimizedImageUrl(pages[next].url);
    }
    if (prev >= 0 && !loadingPages.has(prev)) {
      const img = new Image();
      img.src = getOptimizedImageUrl(pages[prev].url);
    }
  }
  
  onMount(() => {
    loadPages();
    readingStore.init();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<Header>
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
          src={getOptimizedImageUrl(pageData.url)}
          alt="Page {i + 1}"
          loading={i === currentPage ? 'eager' : 'lazy'}
          class="{mode === 'vertical' ? 'w-full max-w-2xl' : 'h-screen w-auto'} object-contain"
          class:opacity-50={Math.abs(i - currentPage) > 1}
        />
      {/each}
    </div>
  {/if}
</Header>
