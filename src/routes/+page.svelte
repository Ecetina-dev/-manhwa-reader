<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import SerieCard from '$lib/components/SerieCard.svelte';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-6">Popular Manga</h1>
      
      <form method="GET" action="/" class="relative max-w-md">
        <input 
          type="text"
          name="q"
          value={data.searchQuery || ''}
          placeholder="Search manga..."
          class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button 
          type="submit"
          class="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-md transition-colors"
        >
          Search
        </button>
      </form>
    </div>
    
    {#if data.series.length === 0}
      <div class="text-center py-20 text-gray-500">
        No manga found
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {#each data.series as serie (serie.id)}
          <SerieCard {serie} />
        {/each}
      </div>
    {/if}
  </div>
</Header>
