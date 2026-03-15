<script lang="ts">
  import type { Serie } from '$lib/types';
  
  interface Props {
    serie: Serie;
  }
  
  let { serie }: Props = $props();
</script>

<a 
  href="/{serie.id}" 
  class="group block bg-[var(--color-bg-card)] rounded-2xl overflow-hidden card-hover border border-[var(--color-border)]"
>
  <div class="aspect-[2/3] bg-[var(--color-bg-secondary)] relative overflow-hidden">
    {#if serie.cover}
      <img 
        src={serie.cover} 
        alt={serie.title}
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-600">
        No Cover
      </div>
    {/if}
    
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
    
    <!-- Status badge -->
    <div class="absolute top-3 left-3">
      <span class="badge badge-{serie.status === 'completed' ? 'success' : 'primary'}">
        {serie.status}
      </span>
    </div>
    
    <!-- Chapter count -->
    <div class="absolute bottom-3 right-3">
      <span class="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
        {serie.chapters?.length || 0} ch
      </span>
    </div>
  </div>
  
  <div class="p-4">
    <h3 class="text-white font-semibold text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-tight mb-2">
      {serie.title}
    </h3>
    <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
      <span class="capitalize">{serie.status}</span>
      <span>•</span>
      <span>{serie.chapters?.length || 0} chapters</span>
    </div>
  </div>
</a>
