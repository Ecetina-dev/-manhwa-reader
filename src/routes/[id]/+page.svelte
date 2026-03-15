<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Header from '$lib/components/Header.svelte';
  import { getMangaById } from '$lib/mangadex';
  import type { Serie } from '$lib/types';
  
  let serie: Serie | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  
  const mangaId = $derived($page.params.id);
  
  async function loadSerie() {
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
    <div class="flex items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-center py-20 text-red-500">
      {error}
    </div>
  {:else if serie}
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row gap-8 mb-8">
        <div class="w-48 flex-shrink-0">
          <img 
            src={serie.cover} 
            alt={serie.title}
            class="w-full rounded-lg shadow-lg"
          />
        </div>
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-white mb-4">{serie.title}</h1>
          <p class="text-gray-400 mb-4">{serie.description || 'No description available'}</p>
          <div class="flex gap-4 text-sm text-gray-500">
            <span class="capitalize">{serie.status}</span>
            <span>•</span>
            <span>{serie.chapters.length} chapters</span>
          </div>
        </div>
      </div>
      
      <h2 class="text-2xl font-bold text-white mb-4">Chapters</h2>
      <div class="space-y-2">
        {#each serie.chapters as chapter (chapter.id)}
          <a 
            href="/{serie.id}/{chapter.id}"
            class="flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition-colors"
          >
            <div>
              <span class="text-white font-medium">Chapter {chapter.number}</span>
              {#if chapter.title}
                <span class="text-gray-400 ml-2">{chapter.title}</span>
              {/if}
            </div>
            <span class="text-gray-500 text-sm">
              {new Date(chapter.publishAt).toLocaleDateString()}
            </span>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</Header>
