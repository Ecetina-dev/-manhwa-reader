<script lang="ts">
  interface Props {
    variant?: 'card' | 'text' | 'image' | 'circle';
    width?: string;
    height?: string;
    class?: string;
  }

  let { variant = 'text', width = '100%', height = '1rem', class: className = '' }: Props = $props();
</script>

<div 
  class="skeleton {variant} {className}"
  style="width: {width}; height: {height};"
></div>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-bg-card, #1a1a24) 25%,
      var(--color-bg-secondary, #2a2a3a) 50%,
      var(--color-bg-card, #1a1a24) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .skeleton.circle {
    border-radius: 50%;
  }

  .skeleton.card {
    border-radius: 12px;
  }

  .skeleton.image {
    aspect-ratio: 2/3;
    border-radius: 8px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
