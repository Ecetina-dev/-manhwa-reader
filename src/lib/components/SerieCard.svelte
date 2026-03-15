<script lang="ts">
  import type { Serie } from '$lib/types';
  
  interface Props {
    serie: Serie;
  }
  
  let { serie }: Props = $props();
</script>

<a 
  href="/{serie.id}" 
  class="group block bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all duration-300 hover:scale-[1.02]"
>
  <div class="aspect-[3/4] bg-gray-800 relative overflow-hidden">
    {#if serie.cover}
      <img 
        src={serie.cover} 
        alt={serie.title}
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-600">
        No Cover
      </div>
    {/if}
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
  </div>
  <div class="p-3">
    <h3 class="text-white font-medium text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
      {serie.title}
    </h3>
    <span class="text-gray-500 text-xs capitalize mt-1 block">
      {serie.status}
    </span>
  </div>
</a>
