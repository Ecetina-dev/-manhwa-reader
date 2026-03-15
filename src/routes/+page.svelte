<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import SerieCard from '$lib/components/SerieCard.svelte';
  import { getMangaList, searchManga } from '$lib/mangadex';
  import type { Serie } from '$lib/types';
  
  let series: Serie[] = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let searching = $state(false);
  
  async function loadSeries() {
    loading = true;
    try {
      series = await getMangaList(0, 20);
    } catch (e) {
      console.error('Failed to load manga', e);
    } finally {
      loading = false;
    }
  }
  
  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadSeries();
      return;
    }
    searching = true;
    try {
      series = await searchManga(searchQuery);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      searching = false;
    }
  }
  
  onMount(() => {
    loadSeries();
  });
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-6">Popular Manga</h1>
      
      <div class="relative max-w-md">
        <input 
          type="text"
          bind:value={searchQuery}
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search manga..."
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          onclick={handleSearch}
          class="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md transition-colors"
        >
          Search
        </button>
      </div>
    </div>
    
    {#if loading}
      <div class="flex items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if series.length === 0}
      <div class="text-center py-20 text-gray-500">
        No manga found
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {#each series as serie (serie.id)}
          <SerieCard {serie} />
        {/each}
      </div>
    {/if}
  </div>
</Header>
