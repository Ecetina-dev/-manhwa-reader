<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { getMangaById } from '$lib/mangadex';
  import type { Serie } from '$lib/types';
  
  let serie: Serie | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  
  const mangaId = $derived($page.params.id ?? '');
  
  async function loadSerie() {
    if (!mangaId) return;
    
    loading = true;
    error = '';
    try {
      serie = await getMangaById(mangaId);
    } catch (e) {
      console.error('Failed to load manga', e);
      error = 'Failed to load manga details';
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadSerie();
  });
</script>

<Header>
  {#if loading}
    <div class="flex items-center justify-center py-32">
      <div class="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-center py-32 text-red-500">
      {error}
    </div>
  {:else if serie}
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Manga Header -->
      <div class="flex flex-col md:flex-row gap-8 mb-10">
        <!-- Cover -->
        <div class="w-52 md:w-64 flex-shrink-0 mx-auto md:mx-0">
          <div class="rounded-2xl overflow-hidden border-2 border-[var(--color-border)] card-hover">
            {#if serie.cover}
              <img 
                src={serie.cover} 
                alt={serie.title}
                class="w-full aspect-[2/3] object-cover"
              />
            {:else}
              <div class="w-full aspect-[2/3] bg-[var(--color-bg-card)] flex items-center justify-center text-gray-600">
                No Cover
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Info -->
        <div class="flex-1 text-center md:text-left">
          <div class="flex items-center justify-center md:justify-start gap-3 mb-4">
            <span class="badge badge-{serie.status === 'completed' ? 'success' : 'primary'}">
              {serie.status}
            </span>
            <span class="text-[var(--color-text-muted)]">
              {serie.chapters.length} chapters
            </span>
          </div>
          
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {serie.title}
          </h1>
          
          {#if serie.description}
            <p class="text-[var(--color-text-muted)] mb-6 leading-relaxed">
              {serie.description}
            </p>
          {/if}
          
          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-4 justify-center md:justify-start">
            {#if serie.chapters.length > 0}
              <a 
                href="/{serie.id}/{serie.chapters[0].id}"
                class="btn-primary text-lg px-8 py-3"
              >
                Start Reading →
              </a>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Chapters -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">
            Chapters
          </h2>
          <span class="text-[var(--color-text-muted)]">
            {serie.chapters.length} chapters available
          </span>
        </div>
        
        {#if serie.chapters.length === 0}
          <div class="text-center py-12 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)]">
            <p class="text-[var(--color-text-muted)]">No chapters available</p>
          </div>
        {:else}
          <div class="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
            {#each serie.chapters as chapter, i (chapter.id)}
              <a 
                href="/{serie.id}/{chapter.id}"
                class="flex items-center justify-between bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] rounded-xl p-4 transition-all border border-transparent hover:border-[var(--color-primary)] group"
              >
                <div class="flex items-center gap-4">
                  <span class="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                    {i + 1}
                  </span>
                  <div>
                    <span class="text-white font-medium block">
                      Chapter {chapter.number}
                    </span>
                    {#if chapter.title}
                      <span class="text-[var(--color-text-muted)] text-sm">
                        {chapter.title}
                      </span>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[var(--color-text-muted)] text-sm">
                    {new Date(chapter.publishAt).toLocaleDateString()}
                  </span>
                  <svg class="w-5 h-5 text-gray-600 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</Header>
