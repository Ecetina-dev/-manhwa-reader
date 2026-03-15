<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import SerieCard from '$lib/components/SerieCard.svelte';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Hero Section -->
    <div class="mb-12 text-center">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
        Discover <span class="gradient-text">Amazing</span> Stories
      </h1>
      <p class="text-[var(--color-text-muted)] text-lg mb-8 max-w-2xl mx-auto">
        Read thousands of manga, manhwa, and comics from around the world. 
        Offline reading supported.
      </p>
      
      <!-- Search Bar -->
      <form method="GET" action="/" class="relative max-w-xl mx-auto">
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            name="q"
            value={data.searchQuery || ''}
            placeholder="Search for manga, manhwa, comics..."
            class="w-full input-search pl-12 pr-32 py-4 text-base"
          />
          <button 
            type="submit"
            class="absolute right-2 top-1/2 -translate-y-1/2 btn-primary"
          >
            Search
          </button>
        </div>
      </form>
      
      <!-- Quick stats -->
      <div class="flex justify-center gap-8 mt-8 text-sm">
        <div class="text-center">
          <div class="text-2xl font-bold gradient-text">10K+</div>
          <div class="text-[var(--color-text-muted)]">Manga</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold gradient-text">Daily</div>
          <div class="text-[var(--color-text-muted)]">Updates</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold gradient-text">Free</div>
          <div class="text-[var(--color-text-muted)]">To Read</div>
        </div>
      </div>
    </div>
    
    <!-- Section Title -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-white">
        {data.searchQuery ? 'Search Results' : 'Popular Now'}
      </h2>
      {#if data.searchQuery}
        <a href="/" class="text-[var(--color-primary)] hover:text-white transition-colors text-sm">
          Clear search →
        </a>
      {/if}
    </div>
    
    {#if data.series.length === 0}
      <div class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-[var(--color-text-muted)] text-lg">No manga found</p>
        <p class="text-gray-600 text-sm mt-2">Try a different search term</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {#each data.series as serie, i (serie.id)}
          <div class="animate-fade-in" style="animation-delay: {i * 50}ms">
            <SerieCard {serie} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Header>
