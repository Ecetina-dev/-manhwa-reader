<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import Header from '$lib/components/Header.svelte';
  import ReaderSettings from '$lib/components/ReaderSettings.svelte';
  import { readingStore } from '$lib/stores/reading';
  import { userStore } from '$lib/stores/user';
  import { readerSettings } from '$lib/stores/reader-settings';
  import type { MangaDexPage } from '$lib/types';
  
  let { data }: { data: PageData } = $props();
  
  let pages: MangaDexPage[] = $state([]);
  let currentPage = $state(0);
  let error = $state('');
  let pageAnnounced = $state('');
  let showControls = $state(true);
  let controlsTimeout: ReturnType<typeof setTimeout>;
  
  const chapter = $derived(data.chapter);
  const manga = $derived(data.manga);
  const chapters = $derived(data.chapters || []);
  const mangaType = $derived(data.mangaType || 'manga');
  
  const settings = $derived($readerSettings);
  
  const serieId = $derived(manga ? String(manga.id) : '');
  const chapterId = $derived(chapter ? String(chapter.id) : '');
  
  // Determine reading direction and mode based on manga type
  const readingMode = $derived.by(() => {
    // User can override with settings
    if (settings.readingMode === 'horizontal' || settings.readingMode === 'vertical') {
      return settings.readingMode;
    }
    
    // Auto-detect based on manga type
    switch (mangaType) {
      case 'manhwa':
      case 'manhua':
        return 'vertical'; // Webtoon style
      case 'comic':
        return 'horizontal-ltr';
      case 'manga':
      default:
        return 'horizontal-rtl'; // Traditional manga
    }
  });
  
  // Reading direction for horizontal mode
  const isRTL = $derived(readingMode === 'horizontal-rtl');
  const isLTR = $derived(readingMode === 'horizontal-ltr');
  const isVertical = $derived(readingMode === 'vertical');
  
  // Type label for UI
  const typeLabel = $derived.by(() => {
    switch (mangaType) {
      case 'manhwa': return 'Manhwa (Korean)';
      case 'manhua': return 'Manhua (Chinese)';
      case 'comic': return 'Comic (Western)';
      case 'manga':
      default: return 'Manga (Japanese)';
    }
  });
  
  // Direction label for navigation hints
  const directionHint = $derived.by(() => {
    switch (readingMode) {
      case 'horizontal-rtl': return '← Right to Left';
      case 'horizontal-ltr': return 'Left to Right →';
      case 'vertical': return '↓ Scroll Down';
      default: return '';
    }
  });
  
  // Progress percentage
  const progressPercent = $derived(pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0);
  
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
      // Prefetch next page image
      if (currentPage < pages.length - 1) {
        const nextImg = new Image();
        nextImg.src = pages[currentPage + 1]?.url || '';
      }
    }
  });
  
  // Prefetch next chapter when near end
  $effect(() => {
    if (currentPage >= pages.length - 3 && nextChapter) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/${serieId}/${nextChapter.id}`;
      document.head.appendChild(link);
    }
  });
  
  // Announce page changes to screen readers
  $effect(() => {
    if (pages.length > 0) {
      pageAnnounced = `Page ${currentPage + 1} of ${pages.length}`;
    }
  });
  
  // Auto-hide controls
  function resetControlsTimeout() {
    showControls = true;
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      showControls = false;
    }, 3000);
  }
  
  // Load saved progress on mount
  onMount(async () => {
    await userStore.init();
    resetControlsTimeout();
    
    if (chapterId && manga) {
      await userStore.addToHistory(Number(manga.id), Number(chapter.id), 0);
      
      const savedProgress = await readingStore.getProgress(chapterId);
      if (savedProgress && savedProgress.chapterId === chapterId) {
        currentPage = savedProgress.page;
      }
    }
    
    return () => {
      clearTimeout(controlsTimeout);
    };
  });
  
  async function saveProgress() {
    await readingStore.updateProgress(serieId, chapterId, currentPage);
  }
  
  // Navigation functions based on reading direction
  function nextPage() {
    if (currentPage < pages.length - 1) {
      currentPage++;
      saveProgress();
      resetControlsTimeout();
    }
  }
  
  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      saveProgress();
      resetControlsTimeout();
    }
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (e.key) {
      case 'ArrowRight':
        if (isRTL) {
          e.preventDefault();
          nextPage(); // RTL: right arrow goes forward
        } else {
          e.preventDefault();
          prevPage(); // LTR/Vertical: right arrow goes back
        }
        break;
      case 'ArrowLeft':
        if (isRTL) {
          e.preventDefault();
          prevPage(); // RTL: left arrow goes back
        } else {
          e.preventDefault();
          nextPage(); // LTR/Vertical: left arrow goes forward
        }
        break;
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault();
          nextPage();
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault();
          prevPage();
        }
        break;
      case ' ':
        e.preventDefault();
        if (isVertical) {
          nextPage();
        } else {
          isRTL ? nextPage() : prevPage();
        }
        break;
      case 'Home':
        e.preventDefault();
        currentPage = 0;
        saveProgress();
        break;
      case 'End':
        e.preventDefault();
        currentPage = pages.length - 1;
        saveProgress();
        break;
      case 'Escape':
        showControls = !showControls;
        break;
    }
  }
  
  function handleMouseMove() {
    resetControlsTimeout();
  }
  
  function getImageUrl(index: number): string {
    return pages[index]?.url || '';
  }
  
  // Background style based on settings
  const readerBackground = $derived({
    backgroundColor: settings.brightness 
      ? `brightness(${settings.brightness}%)` 
      : settings.backgroundColor,
    color: settings.textColor
  });
  
  // Handle scroll for vertical mode
  let containerRef: HTMLDivElement;
  
  function handleVerticalScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    
    if (scrollHeight > 0) {
      const newPage = Math.round((scrollTop / scrollHeight) * (pages.length - 1));
      if (newPage !== currentPage && newPage >= 0 && newPage < pages.length) {
        currentPage = newPage;
        saveProgress();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={handleMouseMove} />

<div 
  class="reader-wrapper {readingMode}" 
  style="background: {readerBackground.backgroundColor}; color: {readerBackground.color};"
>
  <ReaderSettings />
  
  <!-- Progress Bar -->
  <div class="progress-bar-container">
    <div class="progress-bar" style="width: {progressPercent}%"></div>
  </div>
  
  {#if chapter && manga}
    <!-- Top Controls -->
    <div class="controls-top" class:hidden={!showControls}>
      <a href="/{serieId}" class="back-btn" aria-label="Back to manga">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span>{manga.title}</span>
      </a>
      
      <div class="chapter-info">
        <span class="type-badge type-{mangaType}">{mangaType.toUpperCase()}</span>
        <span>Chapter {chapter.chapter_number}</span>
        {#if chapter.title}
          - {chapter.title}
        {/if}
      </div>
      
      <div class="page-info">
        {#if isVertical}
          <span class="scroll-hint">{directionHint}</span>
        {/if}
        {currentPage + 1} / {pages.length}
      </div>
    </div>
  {/if}
  
  <!-- Screen reader announcement -->
  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {pageAnnounced} - Reading {typeLabel}
  </div>
  
  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <p class="text-red-500 text-lg mb-4">{error}</p>
    </div>
  {/if}
  
  <!-- Empty State -->
  {#if !chapter || pages.length === 0}
    <div class="empty-state">
      <div class="empty-icon">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p>No pages found</p>
      {#if chapter}
        <p class="text-sm mt-2">Chapter has {chapter.pages || 0} pages in database</p>
      {/if}
    </div>
  {:else if chapter && manga}
    <!-- Pages Container -->
    {#if isVertical}
      <!-- Vertical Scroll (Manhwa/Manhua - Webtoon style) -->
      <div 
        class="pages-container vertical"
        bind:this={containerRef}
        onscroll={handleVerticalScroll}
        role="img"
        aria-label="Chapter pages - scroll to read"
      >
        {#each pages as pageData, i (i)}
          <img 
            src={getImageUrl(i)}
            alt="Page {i + 1}"
            loading={i <= currentPage + 3 ? 'eager' : 'lazy'}
            fetchpriority={i === currentPage ? 'high' : 'low'}
            class="page-image"
            class:active={i === currentPage}
            aria-hidden="false"
          />
        {/each}
      </div>
    {:else if isRTL}
      <!-- Horizontal RTL (Manga - Traditional Japanese) -->
      <div 
        class="pages-container horizontal-rtl"
        role="img"
        aria-label="Chapter pages - right to left"
      >
        {#each pages as pageData, i (i)}
          <img 
            src={getImageUrl(i)}
            alt="Page {i + 1}"
            loading={i <= currentPage + 2 ? 'eager' : 'lazy'}
            fetchpriority={i === currentPage ? 'high' : 'low'}
            class="page-image"
            class:active={i === currentPage}
            aria-hidden={i !== currentPage}
          />
        {/each}
      </div>
    {:else}
      <!-- Horizontal LTR (Comics - Western style) -->
      <div 
        class="pages-container horizontal-ltr"
        role="img"
        aria-label="Chapter pages - left to right"
      >
        {#each pages as pageData, i (i)}
          <img 
            src={getImageUrl(i)}
            alt="Page {i + 1}"
            loading={i <= currentPage + 2 ? 'eager' : 'lazy'}
            fetchpriority={i === currentPage ? 'high' : 'low'}
            class="page-image"
            class:active={i === currentPage}
            aria-hidden={i !== currentPage}
          />
        {/each}
      </div>
    {/if}
    
    <!-- Bottom Navigation -->
    <div 
      class="controls-bottom"
      class:hidden={!showControls}
      aria-label="Reading navigation"
    >
      <!-- Page Navigation -->
      <div class="nav-section">
        {#if isRTL}
          <button 
            onclick={nextPage}
            disabled={currentPage === 0}
            class="nav-btn"
            aria-label="Next page (RTL)"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        {:else}
          <button 
            onclick={prevPage}
            disabled={currentPage === 0}
            class="nav-btn"
            aria-label="Previous page"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        {/if}
        
        {#if settings.showPageNumber}
          <span class="page-indicator">
            {currentPage + 1} / {pages.length}
          </span>
        {/if}
        
        {#if isRTL}
          <button 
            onclick={prevPage}
            disabled={currentPage === pages.length - 1}
            class="nav-btn"
            aria-label="Previous page (RTL)"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {:else}
          <button 
            onclick={nextPage}
            disabled={currentPage === pages.length - 1}
            class="nav-btn"
            aria-label="Next page"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {/if}
      </div>
      
      <!-- Reading Direction Hint -->
      {#if !isVertical}
        <div class="direction-hint">
          {directionHint}
        </div>
      {/if}
      
      <!-- Chapter Navigation -->
      {#if chapters.length > 0}
        <div class="nav-section chapter-nav">
          {#if prevChapter}
            <a 
              href="/{serieId}/{prevChapter.id}"
              class="chapter-btn"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Ch. {prevChapter.number}
            </a>
          {:else}
            <span class="text-sm text-gray-500">First</span>
          {/if}
          
          <span class="chapter-counter">
            {currentChapterIndex + 1} / {chapters.length}
          </span>
          
          {#if nextChapter}
            <a 
              href="/{serieId}/{nextChapter.id}"
              class="chapter-btn next"
            >
              Ch. {nextChapter.number}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          {:else}
            <span class="text-sm text-gray-500">Last</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Spacer -->
<div class="spacer"></div>

<style>
  .reader-wrapper {
    min-height: 100vh;
    position: relative;
  }
  
  /* Progress Bar */
  .progress-bar-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(128, 128, 128, 0.3);
    z-index: 100;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #06b6d4);
    transition: width 0.3s ease;
  }
  
  /* Top Controls */
  .controls-top {
    position: fixed;
    top: 4px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
    z-index: 50;
    transition: opacity 0.3s, transform 0.3s;
  }
  
  .controls-top.hidden {
    opacity: 0;
    transform: translateY(-100%);
    pointer-events: none;
  }
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-size: 0.9rem;
    opacity: 0.9;
    transition: opacity 0.2s;
  }
  
  .back-btn:hover {
    opacity: 1;
  }
  
  .chapter-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .type-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  .type-manga {
    background: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }
  
  .type-manhwa {
    background: rgba(59, 130, 246, 0.3);
    color: #93c5fd;
  }
  
  .type-manhua {
    background: rgba(234, 179, 8, 0.3);
    color: #fde047;
  }
  
  .type-comic {
    background: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }
  
  .page-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .scroll-hint {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  /* Empty/Error State */
  .empty-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    color: #9ca3af;
  }
  
  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }
  
  /* Pages Container - Vertical (Manhwa/Manhua) */
  .pages-container.vertical {
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100vh;
    padding-top: 60px;
    padding-bottom: 120px;
    scroll-behavior: smooth;
  }
  
  .pages-container.vertical .page-image {
    width: 100%;
    max-width: 800px;
    display: block;
    margin: 0 auto;
  }
  
  /* Pages Container - Horizontal RTL (Manga) */
  .pages-container.horizontal-rtl {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    height: 100vh;
    scroll-snap-type: x mandatory;
  }
  
  .pages-container.horizontal-rtl .page-image {
    height: 100vh;
    width: auto;
    max-width: 100vw;
    scroll-snap-align: center;
    flex-shrink: 0;
  }
  
  /* Pages Container - Horizontal LTR (Comics) */
  .pages-container.horizontal-ltr {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    height: 100vh;
    scroll-snap-type: x mandatory;
  }
  
  .pages-container.horizontal-ltr .page-image {
    height: 100vh;
    width: auto;
    max-width: 100vw;
    scroll-snap-align: center;
    flex-shrink: 0;
  }
  
  /* Page Image */
  .page-image {
    object-fit: contain;
    background: #000;
  }
  
  .page-image:not(.active) {
    position: absolute;
    pointer-events: none;
    opacity: 0;
  }
  
  /* Bottom Controls */
  .controls-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
    padding: 16px 20px 24px;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    z-index: 50;
    transition: opacity 0.3s, transform 0.3s;
    flex-wrap: wrap;
  }
  
  .controls-bottom.hidden {
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
  }
  
  .direction-hint {
    width: 100%;
    text-align: center;
    color: rgba(255,255,255,0.5);
    font-size: 0.8rem;
    margin-top: -8px;
  }
  
  .nav-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .nav-btn:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.6);
    transform: scale(1.05);
  }
  
  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .page-indicator {
    color: white;
    font-size: 1rem;
    font-weight: 500;
    min-width: 80px;
    text-align: center;
  }
  
  .chapter-nav {
    background: rgba(255,255,255,0.1);
    border-radius: 9999px;
    padding: 8px 16px;
    gap: 12px;
  }
  
  .chapter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 9999px;
    background: rgba(139, 92, 246, 0.3);
    transition: all 0.2s;
  }
  
  .chapter-btn:hover {
    background: rgba(139, 92, 246, 0.6);
  }
  
  .chapter-btn.next {
    background: rgba(6, 182, 212, 0.3);
  }
  
  .chapter-btn.next:hover {
    background: rgba(6, 182, 212, 0.6);
  }
  
  .chapter-counter {
    color: rgba(255,255,255,0.7);
    font-size: 0.85rem;
  }
  
  .spacer {
    height: 120px;
  }
  
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
</style>
