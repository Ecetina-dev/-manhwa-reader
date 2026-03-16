<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';

  interface Props {
    mangaId: number;
    title: string;
  }

  let { mangaId, title }: Props = $props();
  
  let isFavorite = $state(false);
  let loading = $state(true);
  let toggling = $state(false);

  onMount(async () => {
    await userStore.init();
    isFavorite = userStore.isFavorite(mangaId);
    loading = false;
  });

  async function toggleFavorite() {
    if (toggling) return;
    toggling = true;
    
    isFavorite = await userStore.toggleFavorite(mangaId);
    
    toggling = false;
  }
</script>

<button
  class="favorite-btn"
  class:active={isFavorite}
  onclick={toggleFavorite}
  disabled={loading || toggling}
  aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
  aria-pressed={isFavorite}
>
  <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
  <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
</button>

<style>
  .favorite-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid var(--color-border, #2a2a3a);
    background: var(--color-bg-card, #1a1a24);
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .favorite-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .favorite-btn.active {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #ef4444;
  }

  .favorite-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .favorite-btn svg {
    width: 18px;
    height: 18px;
  }
</style>
