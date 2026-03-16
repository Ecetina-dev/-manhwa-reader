<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import SerieCard from '$lib/components/SerieCard.svelte';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let filters = $derived(data.filters);
  
  function buildUrl(newFilters: Record<string, string>): string {
    const params = new URLSearchParams();
    if (newFilters.q) params.set('q', newFilters.q);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.demographic) params.set('demographic', newFilters.demographic);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.page && newFilters.page !== '1') params.set('page', newFilters.page);
    return params.toString() ? `?${params.toString()}` : '';
  }
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Page Title -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Browse Manga</h1>
      <p class="text-[var(--color-text-muted)]">
        {filters.total} series found
        {#if filters.q}
          for "{filters.q}"
        {/if}
      </p>
    </div>
    
    <!-- Filters -->
    <div class="bg-[var(--color-bg-card)] rounded-2xl p-6 mb-8 border border-[var(--color-border)]">
      <form method="GET" class="space-y-4">
        <!-- Search Row -->
        <div class="flex gap-4">
          <div class="flex-1 relative">
            <label for="search" class="sr-only">Search</label>
            <input 
              type="text"
              name="q"
              value={filters.q}
              placeholder="Search manga..."
              class="w-full input-search px-4 py-3"
            />
          </div>
          <button type="submit" class="btn-primary px-6">
            Search
          </button>
        </div>
        
        <!-- Filter Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Type -->
          <div>
            <label for="type" class="block text-sm text-[var(--color-text-muted)] mb-2">Type</label>
            <select name="type" id="type" class="w-full input-search px-4 py-3">
              <option value="">All Types</option>
              <option value="manga" selected={filters.type === 'manga'}>Manga (Japanese)</option>
              <option value="manhwa" selected={filters.type === 'manhwa'}>Manhwa (Korean)</option>
              <option value="manhua" selected={filters.type === 'manhua'}>Manhua (Chinese)</option>
              <option value="comic" selected={filters.type === 'comic'}>Comic</option>
            </select>
          </div>
          
          <!-- Status -->
          <div>
            <label for="status" class="block text-sm text-[var(--color-text-muted)] mb-2">Status</label>
            <select name="status" id="status" class="w-full input-search px-4 py-3">
              <option value="">All Status</option>
              <option value="ongoing" selected={filters.status === 'ongoing'}>Ongoing</option>
              <option value="completed" selected={filters.status === 'completed'}>Completed</option>
              <option value="hiatus" selected={filters.status === 'hiatus'}>Hiatus</option>
              <option value="cancelled" selected={filters.status === 'cancelled'}>Cancelled</option>
            </select>
          </div>
          
          <!-- Demographic -->
          <div>
            <label for="demographic" class="block text-sm text-[var(--color-text-muted)] mb-2">Demographic</label>
            <select name="demographic" id="demographic" class="w-full input-search px-4 py-3">
              <option value="">All Demographics</option>
              <option value="shonen" selected={filters.demographic === 'shonen'}>Shonen (Boys)</option>
              <option value="shoujo" selected={filters.demographic === 'shoujo'}>Shoujo (Girls)</option>
              <option value="seinen" selected={filters.demographic === 'seinen'}>Seinen (Men)</option>
              <option value="josei" selected={filters.demographic === 'josei'}>Josei (Women)</option>
            </select>
          </div>
        </div>
        
        <!-- Sort Row -->
        <div class="flex items-center gap-4 pt-2">
          <label for="sort" class="text-sm text-[var(--color-text-muted)]">Sort by:</label>
          <select name="sort" id="sort" class="input-search px-4 py-2 text-sm">
            <option value="updated" selected={filters.sort === 'updated'}>Recently Updated</option>
            <option value="newest" selected={filters.sort === 'newest'}>Newest First</option>
            <option value="oldest" selected={filters.sort === 'oldest'}>Oldest First</option>
            <option value="title" selected={filters.sort === 'title'}>Title (A-Z)</option>
            <option value="rating" selected={filters.sort === 'rating'}>Highest Rated</option>
            <option value="views" selected={filters.sort === 'views'}>Most Popular</option>
          </select>
        </div>
        
        <!-- Active Filters & Clear -->
        <div class="flex flex-wrap gap-2 pt-2">
          {#if filters.type || filters.status || filters.demographic}
            <span class="text-sm text-[var(--color-text-muted)]">Active filters:</span>
            {#if filters.type}
              <span class="filter-tag">
                Type: {filters.type}
                <a href={buildUrl({ q: filters.q, status: filters.status, type: '', demographic: filters.demographic })} class="ml-1">×</a>
              </span>
            {/if}
            {#if filters.status}
              <span class="filter-tag">
                Status: {filters.status}
                <a href={buildUrl({ q: filters.q, status: '', type: filters.type, demographic: filters.demographic })} class="ml-1">×</a>
              </span>
            {/if}
            {#if filters.demographic}
              <span class="filter-tag">
                Demographic: {filters.demographic}
                <a href={buildUrl({ q: filters.q, status: filters.status, type: filters.type, demographic: '' })} class="ml-1">×</a>
              </span>
            {/if}
            <a href="/browse{filters.q ? `?q=${filters.q}` : ''}" class="text-sm text-[var(--color-primary)] hover:underline ml-2">
              Clear all
            </a>
          {/if}
        </div>
      </form>
    </div>
    
    <!-- Results -->
    {#if data.series.length === 0}
      <div class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-[var(--color-text-muted)] text-lg">No manga found</p>
        <p class="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
      </div>
    {:else}
      <div 
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
        role="list"
        aria-label="Manga series"
      >
        {#each data.series as serie, i (serie.id)}
          <div class="animate-fade-in" style="animation-delay: {i * 30}ms" role="listitem">
            <SerieCard {serie} />
          </div>
        {/each}
      </div>
      
      <!-- Pagination -->
      {#if filters.totalPages > 1}
        <div class="flex justify-center gap-2 mt-12">
          {#if filters.page > 1}
            <a 
              href={buildUrl({ page: String(filters.page - 1) })}
              class="px-4 py-2 bg-[var(--color-bg-card)] rounded-lg text-white hover:bg-[var(--color-primary)] transition-colors"
            >
              ← Previous
            </a>
          {/if}
          
          <span class="px-4 py-2 text-[var(--color-text-muted)]">
            Page {filters.page} of {filters.totalPages}
          </span>
          
          {#if filters.page < filters.totalPages}
            <a 
              href={buildUrl({ page: String(filters.page + 1) })}
              class="px-4 py-2 bg-[var(--color-bg-card)] rounded-lg text-white hover:bg-[var(--color-primary)] transition-colors"
            >
              Next →
            </a>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</Header>

<style>
  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    border-radius: 9999px;
    font-size: 0.875rem;
  }
  
  .filter-tag a {
    color: inherit;
    text-decoration: none;
  }
  
  .filter-tag a:hover {
    color: white;
  }
</style>
