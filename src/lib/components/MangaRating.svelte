<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';

  interface Props {
    mangaId: number;
  }

  let { mangaId }: Props = $props();
  
  let rating = $state({ average: 0, count: 0, userRating: 0 });
  let loading = $state(true);
  let hoverRating = $state(0);
  let submitting = $state(false);

  onMount(async () => {
    await userStore.init();
    await loadRating();
  });

  async function loadRating() {
    loading = true;
    const data = await userStore.getRating(mangaId);
    if (data) {
      rating = data as any;
    }
    loading = false;
  }

  async function setRating(value: number) {
    if (submitting) return;
    submitting = true;
    
    const result = await userStore.rateManga(mangaId, value);
    if (result) {
      rating = { ...rating, ...result, userRating: value };
    }
    
    submitting = false;
  }
</script>

<div class="rating-container">
  <div class="rating-header">
    <span class="rating-label">Rating</span>
    {#if loading}
      <span class="rating-loading">Loading...</span>
    {:else}
      <span class="rating-value">
        <span class="rating-stars">
          {#each [1, 2, 3, 4, 5] as star}
            <button
              class="star-btn"
              class:filled={star <= (hoverRating || rating.userRating || rating.average)}
              class:hover={star <= hoverRating && hoverRating !== rating.userRating}
              onclick={() => setRating(star)}
              onmouseenter={() => hoverRating = star}
              onmouseleave={() => hoverRating = 0}
              disabled={submitting}
              aria-label="Rate {star} stars"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          {/each}
        </span>
        <span class="rating-number">
          {rating.average.toFixed(1)} 
          <span class="rating-count">({rating.count} votes)</span>
        </span>
      </span>
    {/if}
  </div>
</div>

<style>
  .rating-container {
    background: var(--color-bg-card, #1a1a24);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--color-border, #2a2a3a);
  }

  .rating-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .rating-label {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .rating-loading {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
  }

  .rating-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rating-stars {
    display: flex;
    gap: 2px;
  }

  .star-btn {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    width: 24px;
    height: 24px;
    color: #4b5563;
    transition: color 0.15s, transform 0.15s;
  }

  .star-btn:hover {
    transform: scale(1.1);
  }

  .star-btn.filled {
    color: #fbbf24;
  }

  .star-btn.hover:not(.filled) {
    color: #f59e0b;
  }

  .star-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .star-btn svg {
    width: 100%;
    height: 100%;
  }

  .rating-number {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .rating-count {
    color: var(--color-text-muted, #9ca3af);
    font-weight: 400;
    font-size: 0.875rem;
  }
</style>
