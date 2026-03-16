<script lang="ts">
  import type { Serie } from '$lib/types';
  
  interface Props {
    serie: Serie;
  }
  
  let { serie }: Props = $props();
  
  const typeLabels: Record<string, string> = {
    manga: 'Manga',
    manhwa: 'Manhwa',
    manhua: 'Manhua',
    comic: 'Comic'
  };
</script>

<a 
  href="/{serie.id}" 
  class="group block bg-[var(--color-bg-card)] rounded-2xl overflow-hidden card-hover border border-[var(--color-border)] focus-ring"
  aria-label="Read {serie.title}"
  data-sveltekit-preload-data
>
  <div class="aspect-[2/3] bg-[var(--color-bg-secondary)] relative overflow-hidden">
    {#if serie.cover}
      <img 
        src={serie.cover} 
        alt="" 
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        aria-hidden="true"
      />
    {:else}
      <div 
        class="w-full h-full flex items-center justify-center text-gray-600" 
        role="img" 
        aria-label="No cover image available"
      >
        No Cover
      </div>
    {/if}
    
    <!-- Gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
    
    <!-- Status and Type badges -->
    <div class="absolute top-3 left-3 flex gap-2">
      <span 
        class="badge badge-{serie.status === 'completed' ? 'success' : 'primary'}"
        aria-label="Status: {serie.status}"
      >
        {serie.status}
      </span>
      {#if serie.type}
        <span 
          class="badge badge-type"
          aria-label="Type: {serie.type}"
        >
          {typeLabels[serie.type] || serie.type}
        </span>
      {/if}
    </div>
    
    <!-- Chapter count -->
    <div class="absolute bottom-3 right-3">
      <span 
        class="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full"
        aria-label="{serie.chapters?.length || 0} chapters available"
      >
        {serie.chapters?.length || 0} ch
      </span>
    </div>
  </div>
  
  <div class="p-4">
    <h3 
      class="text-white font-semibold text-sm line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-tight mb-2"
    >
      {serie.title}
    </h3>
    <div 
      class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
      role="list"
      aria-label="Serie information"
    >
      <span class="capitalize" role="listitem">{serie.status}</span>
      <span role="listitem">•</span>
      <span role="listitem">{serie.chapters?.length || 0} chapters</span>
    </div>
  </div>
</a>
