<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import SerieCard from '$lib/components/SerieCard.svelte';
  import { userStore } from '$lib/stores/user';

  let favorites = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await userStore.init();
    await loadFavorites();
  });

  async function loadFavorites() {
    loading = true;
    const userId = userStore.getUserId();
    try {
      const res = await fetch(`/api/favorites?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        favorites = data.data;
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
    loading = false;
  }
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">My Favorites</h1>
      <p class="text-[var(--color-text-muted)]">
        {favorites.length} series in your favorites list
      </p>
    </div>
    
    {#if loading}
      <div class="text-center py-20 text-[var(--color-text-muted)]">
        Loading favorites...
      </div>
    {:else if favorites.length === 0}
      <div class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p class="text-[var(--color-text-muted)] text-lg">No favorites yet</p>
        <p class="text-gray-600 text-sm mt-2">Add series to your favorites from their detail pages</p>
        <a href="/browse" class="btn-primary inline-block mt-6">Browse Series</a>
      </div>
    {:else}
      <div 
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5"
        role="list"
        aria-label="Favorite series"
      >
        {#each favorites as fav, i (fav.manga?.id)}
          <div class="animate-fade-in" style="animation-delay: {i * 30}ms" role="listitem">
            {#if fav.manga}
              <SerieCard serie={{
                id: String(fav.manga.id),
                title: fav.manga.title,
                cover: fav.manga.cover,
                description: fav.manga.description,
                status: fav.manga.status,
                chapters: fav.manga.chapters || []
              }} />
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Header>
