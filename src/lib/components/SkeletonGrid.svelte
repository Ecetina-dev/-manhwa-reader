<script lang="ts">
  let { count = 6 }: { count?: number } = $props();
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
  {#each Array(count) as _, i}
    <div class="skeleton-card" style="animation-delay: {i * 50}ms">
      <div class="skeleton-cover"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
      </div>
    </div>
  {/each}
</div>

<style>
  .skeleton-card {
    background: var(--color-bg-card, #1a1a24);
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid var(--color-border, #2a2a3a);
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  .skeleton-cover {
    aspect-ratio: 2/3;
    background: linear-gradient(90deg, #2a2a3a 25%, #3a3a4a 50%, #2a2a3a 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .skeleton-content {
    padding: 1rem;
  }
  
  .skeleton-title {
    height: 1rem;
    width: 80%;
    background: #2a2a3a;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  
  .skeleton-meta {
    height: 0.75rem;
    width: 50%;
    background: #2a2a3a;
    border-radius: 4px;
  }
</style>
