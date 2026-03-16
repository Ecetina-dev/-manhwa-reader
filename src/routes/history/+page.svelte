<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import { userStore } from '$lib/stores/user';

  let history = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await userStore.init();
    await loadHistory();
  });

  async function loadHistory() {
    loading = true;
    const userId = userStore.getUserId();
    try {
      const res = await fetch(`/api/history?user_id=${userId}&limit=50`);
      const data = await res.json();
      if (data.success) {
        history = data.data;
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
    loading = false;
  }

  async function clearHistory() {
    if (!confirm('Are you sure you want to clear your reading history?')) return;
    
    await userStore.clearHistory();
    history = [];
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<Header>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Reading History</h1>
        <p class="text-[var(--color-text-muted)]">
          {history.length} entries in your reading history
        </p>
      </div>
      {#if history.length > 0}
        <button 
          class="btn-secondary text-red-400 hover:text-red-300"
          onclick={clearHistory}
        >
          Clear History
        </button>
      {/if}
    </div>
    
    {#if loading}
      <div class="text-center py-20 text-[var(--color-text-muted)]">
        Loading history...
      </div>
    {:else if history.length === 0}
      <div class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-card)] flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-[var(--color-text-muted)] text-lg">No reading history</p>
        <p class="text-gray-600 text-sm mt-2">Start reading to see your history here</p>
        <a href="/browse" class="btn-primary inline-block mt-6">Browse Series</a>
      </div>
    {:else}
      <div class="history-list">
        {#each history as entry}
          <a 
            href="/{entry.manga?.id}/{entry.chapter?.id}"
            class="history-item"
          >
            <div class="history-cover">
              {#if entry.manga?.cover}
                <img src={entry.manga.cover} alt="" loading="lazy" />
              {:else}
                <div class="no-cover">No Cover</div>
              {/if}
            </div>
            <div class="history-info">
              <h3 class="history-title">{entry.manga?.title || 'Unknown'}</h3>
              <p class="history-chapter">
                Chapter {entry.chapter?.chapter_number}
                {#if entry.chapter?.title}
                  - {entry.chapter.title}
                {/if}
              </p>
              <p class="history-time">{formatDate(entry.created_at)}</p>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</Header>

<style>
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .history-item {
    display: flex;
    gap: 16px;
    padding: 12px;
    background: var(--color-bg-card, #1a1a24);
    border-radius: 12px;
    border: 1px solid var(--color-border, #2a2a3a);
    text-decoration: none;
    transition: all 0.2s;
  }

  .history-item:hover {
    border-color: var(--color-primary, #6366f1);
    transform: translateX(4px);
  }

  .history-cover {
    width: 60px;
    height: 85px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    background: var(--color-bg-secondary, #12121a);
  }

  .history-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .history-cover .no-cover {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    color: var(--color-text-muted, #9ca3af);
  }

  .history-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  .history-title {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .history-chapter {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
    margin: 0 0 4px 0;
  }

  .history-time {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.75rem;
    margin: 0;
  }

  .btn-secondary {
    padding: 8px 16px;
    background: var(--color-bg-card, #1a1a24);
    border: 1px solid var(--color-border, #2a2a3a);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--color-bg-secondary, #12121a);
  }
</style>
