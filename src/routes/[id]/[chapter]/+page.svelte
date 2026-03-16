<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import Header from '$lib/components/Header.svelte';
  import { readingStore } from '$lib/stores/reading';
  import { userStore } from '$lib/stores/user';
  import type { MangaDexPage } from '$lib/types';
  
  let { data }: { data: PageData } = $props();
  
  let pages: MangaDexPage[] = $state([]);
  let currentPage = $state(0);
  let mode: 'vertical' | 'horizontal' = $state('vertical');
  let error = $state('');
  let pageAnnounced = $state('');
  
  const chapter = $derived(data.chapter);
  const manga = $derived(data.manga);
  const chapters = $derived(data.chapters || []);
  
  const serieId = $derived(manga ? String(manga.id) : '');
  const chapterId = $derived(chapter ? String(chapter.id) : '');
  
  // Find current chapter index and prev/next
  const currentChapterIndex = $derived(
    chapters.findIndex((ch: any) => String(ch.id) === chapterId)
  );
  
  const prevChapter = $derived(
    currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : null
  );
  
  const nextChapter = $derived(
    currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : null
  );
  
  // Initialize pages from server data
  $effect(() => {
    if (data.pages && data.pages.length > 0) {
      pages = data.pages as MangaDexPage[];
    }
  });
  
  // Announce page changes to screen readers
  $effect(() => {
    if (pages.length > 0) {
      pageAnnounced = `Page ${currentPage + 1} of ${pages.length}`;
    }
  });
  
  // Load saved progress on mount
  onMount(async () => {
    await userStore.init();
    
    if (chapterId && manga) {
      // Save to reading history
      await userStore.addToHistory(Number(manga.id), Number(chapter.id), 0);
      
      // Load saved progress
      const savedProgress = await readingStore.getProgress(chapterId);
      if (savedProgress && savedProgress.chapterId === chapterId) {
        currentPage = savedProgress.page;
      }
    }
  });
  
  async function saveProgress() {
    await readingStore.updateProgress(serieId, chapterId, currentPage);
  }
  
  function nextPage() {
    if (currentPage < pages.length - 1) {
      currentPage++;
      saveProgress();
    }
  }
  
  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      saveProgress();
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      prevPage();
    } else if (e.key === 'Home') {
      currentPage = 0;
      saveProgress();
    } else if (e.key === 'End') {
      currentPage = pages.length - 1;
      saveProgress();
    }
  }
  
  function getImageUrl(index: number): string {
    return pages[index]?.url || '';
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Header>
  <!-- Error State -->
  {#if error}
    <div 
      class="text-center py-32" 
      role="alert"
      aria-live="assertive"
    >
      <p class="text-red-500 text-lg mb-4">{error}</p>
    </div>
  {/if}
  
  <!-- Empty State -->
  {#if !chapter || pages.length === 0}
    <div 
      class="text-center py-32" 
      role="status"
    >
      <div 
        class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center"
        aria-hidden="true"
      >
        <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-[var(--color-text-muted)] text-lg">No pages found</p>
      {#if chapter}
        <p class="text-[var(--color-text-muted)] mt-2">Chapter has {chapter.pages || 0} pages in database</p>
      {/if}
    </div>
  {:else if chapter && manga}
    <!-- Screen reader announcement for page change -->
    <div 
      class="sr-only" 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
    >
      {pageAnnounced}
    </div>
    
    <!-- Controls -->
    <div 
      class="sticky top-14 z-40 bg-[var(--color-bg-secondary)]/95 backdrop-blur-sm border-b border-[var(--color-border)]"
      role="navigation"
      aria-label="Reading controls"
    >
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <!-- Navigation -->
        <div class="flex items-center gap-3" role="group" aria-label="Page navigation">
          <button 
            onclick={prevPage}
            disabled={currentPage === 0}
            class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
            title="Previous page"
            aria-label="Go to previous page"
            aria-disabled={currentPage === 0}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span 
            class="text-white font-medium min-w-[100px] text-center"
            aria-live="polite"
            aria-atomic="true"
          >
            {currentPage + 1} <span class="text-[var(--color-text-muted)]">/</span> {pages.length}
          </span>
          
          <button 
            onclick={nextPage}
            disabled={currentPage === pages.length - 1}
            class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
            title="Next page"
            aria-label="Go to next page"
            aria-disabled={currentPage === pages.length - 1}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <!-- Mode Toggle -->
        <button 
          onclick={() => mode = mode === 'vertical' ? 'horizontal' : 'vertical'}
          class="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-primary)] transition-all focus-ring"
          title="Toggle reading mode"
          aria-label="Toggle reading mode. Current: {mode === 'vertical' ? 'vertical scroll' : 'horizontal scroll'}"
          aria-pressed={mode === 'vertical'}
        >
          {#if mode === 'vertical'}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Pages -->
    <div 
      class={mode === 'vertical' ? 'flex flex-col items-center' : 'flex flex-row overflow-x-auto snap-x snap-mandatory'}
      role="img"
      aria-label="Chapter pages"
    >
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
          aria-hidden={i !== currentPage}
        />
      {/each}
    </div>
    
    <!-- Bottom Navigation -->
    <div 
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-card)]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[var(--color-border)] shadow-lg"
      aria-label="Quick page navigation"
    >
      <button 
        onclick={prevPage}
        disabled={currentPage === 0}
        aria-label="Previous page"
        class="text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 transition-colors focus-ring"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <span 
        class="text-white font-medium"
        aria-live="polite"
      >
        {currentPage + 1} / {pages.length}
      </span>
      
      <button 
        onclick={nextPage}
        disabled={currentPage === pages.length - 1}
        aria-label="Next page"
        class="text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 transition-colors focus-ring"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    
    <!-- Chapter Navigation -->
    {#if chapters.length > 0}
      <div 
        class="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-card)]/90 backdrop-blur-sm px-6 py-3 rounded-full border border-[var(--color-border)] shadow-lg"
        aria-label="Chapter navigation"
      >
        {#if prevChapter}
          <a 
            href="/{serieId}/{prevChapter.id}"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-primary)] transition-colors focus-ring"
            aria-label="Go to previous chapter"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span class="text-sm font-medium">Ch. {prevChapter.number}</span>
          </a>
        {:else}
          <span class="px-4 py-2 text-[var(--color-text-muted)] text-sm">First Chapter</span>
        {/if}
        
        <span class="text-[var(--color-text-muted)] text-sm">
          {currentChapterIndex + 1} / {chapters.length}
        </span>
        
        {#if nextChapter}
          <a 
            href="/{serieId}/{nextChapter.id}"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-primary)] transition-colors focus-ring"
            aria-label="Go to next chapter"
          >
            <span class="text-sm font-medium">Ch. {nextChapter.number}</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        {:else}
          <span class="px-4 py-2 text-[var(--color-text-muted)] text-sm">Last Chapter</span>
        {/if}
      </div>
    {/if}
  {/if}
</Header>

<!-- Spacer for fixed bottom nav -->
<div class="h-24" aria-hidden="true"></div>

<style>
  /* Screen reader only utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  /* Focus ring utility */
  .focus-ring:focus {
    outline: 2px solid var(--color-primary, #6366f1);
    outline-offset: 2px;
  }
  
  .focus-ring:focus:not(:focus-visible) {
    outline: none;
  }
  
  .focus-ring:focus-visible {
    outline: 2px solid var(--color-primary, #6366f1);
    outline-offset: 2px;
  }
</style>
