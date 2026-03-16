<script lang="ts">
  import type { PageData } from './$types';
  import Header from '$lib/components/Header.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import MangaRating from '$lib/components/MangaRating.svelte';
  import MangaFavorite from '$lib/components/MangaFavorite.svelte';
  import MangaComments from '$lib/components/MangaComments.svelte';
  
  let { data }: { data: PageData } = $props();
  
  let serie = $derived(data.manga);
  
  let seoTitle = $derived(serie ? `${serie.title} - ManHau` : 'Manga Not Found');
  let seoDescription = $derived(serie?.description?.slice(0, 160) || 'Read manga online free');
  let seoImage = $derived(serie?.cover || '/og-image.png');
  let seoUrl = $derived(serie ? `https://manhau.app/${serie.id}` : 'https://manhau.app');
  let seoTags = $derived(serie?.tags || []);
  let seoAuthor = $derived(serie?.author || 'ManHau');
</script>

<SEO 
  title={seoTitle}
  description={seoDescription}
  image={seoImage}
  url={seoUrl}
  type="article"
  author={seoAuthor}
  tags={seoTags}
>
  <Header>
  {#if !serie}
    <div 
      class="text-center py-32 text-red-500" 
      role="alert"
      aria-live="assertive"
    >
      Manga not found
    </div>
  {:else}<div class="max-w-7xl mx-auto px-4 py-8" role="article" aria-labelledby="manga-title">
      <!-- Manga Header -->
      <div class="flex flex-col md:flex-row gap-8 mb-10">
        <!-- Cover -->
        <div class="w-52 md:w-64 flex-shrink-0 mx-auto md:mx-0">
          <div class="rounded-2xl overflow-hidden border-2 border-[var(--color-border)] card-hover" role="img" aria-label="{serie.title} cover">
            {#if serie.cover}
              <img 
                src={serie.cover} 
                alt="" 
                class="w-full aspect-[2/3] object-cover"
                aria-hidden="true"
              />
            {:else}
              <div class="w-full aspect-[2/3] bg-[var(--color-bg-card)] flex items-center justify-center text-gray-600">
                No Cover
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Info -->
        <div class="flex-1 text-center md:text-left">
          <div class="flex items-center justify-center md:justify-start gap-3 mb-4" role="list" aria-label="Manga status and chapters">
            <span 
              class="badge badge-{serie.status === 'completed' ? 'success' : 'primary'}"
              role="listitem"
              aria-label="Status: {serie.status}"
            >
              {serie.status}
            </span>
            <span 
              class="text-[var(--color-text-muted)]"
              role="listitem"
              aria-label="{serie.chapters.length} chapters available"
            >
              {serie.chapters.length} chapters
            </span>
          </div>
          
          <h1 
            id="manga-title"
            class="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
          >
            {serie.title}
          </h1>
          
          {#if serie.description}
            <p class="text-[var(--color-text-muted)] mb-6 leading-relaxed">
              {serie.description}
            </p>
          {/if}
          
          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-4 justify-center md:justify-start">
            {#if serie.chapters.length > 0}
              <a 
                href="/{serie.id}/{serie.chapters[0].id}"
                class="btn-primary text-lg px-8 py-3 focus-ring"
                aria-label="Start reading {serie.title} from Chapter 1"
              >
                Start Reading →
              </a>
            {/if}
            <MangaFavorite mangaId={Number(serie.id)} title={serie.title} />
          </div>
        </div>
        
        <!-- Rating -->
        <div class="mt-6">
          <MangaRating mangaId={Number(serie.id)} />
        </div>
      </div>
      
      <!-- Chapters -->
      <section aria-labelledby="chapters-heading">
        <div class="flex items-center justify-between mb-6">
          <h2 
            id="chapters-heading"
            class="text-2xl font-bold text-white"
          >
            Chapters
          </h2>
          <span class="text-[var(--color-text-muted)]" aria-live="polite">
            {serie.chapters.length} chapters available
          </span>
        </div>
        
        {#if serie.chapters.length === 0}
          <div 
            class="text-center py-12 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)]"
            role="status"
          >
            <p class="text-[var(--color-text-muted)]">No chapters available</p>
          </div>
        {:else}
          <div 
            class="grid gap-3 max-h-[600px] overflow-y-auto pr-2"
          >
            {#each serie.chapters as chapter, i (chapter.id)}
              <a 
                href="/{serie.id}/{chapter.id}"
                class="flex items-center justify-between bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-secondary)] rounded-xl p-4 transition-all border border-transparent hover:border-[var(--color-primary)] group focus-ring"
                aria-label="Chapter {chapter.number}{chapter.title ? ': ' + chapter.title : ''}"
              >
                <div class="flex items-center gap-4">
                  <span 
                    class="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10 transition-colors"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <span class="text-white font-medium block">
                      Chapter {chapter.number}
                    </span>
                    {#if chapter.title}
                      <span class="text-[var(--color-text-muted)] text-sm">
                        {chapter.title}
                      </span>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span 
                    class="text-[var(--color-text-muted)] text-sm"
                    aria-label="Published on {new Date(chapter.publishAt).toLocaleDateString()}"
                  >
                    {new Date(chapter.publishAt).toLocaleDateString()}
                  </span>
                  <svg 
                    class="w-5 h-5 text-gray-600 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </section>
      
      <!-- Comments -->
      <MangaComments mangaId={Number(serie.id)} />
    </div>
  {/if}
</Header>
</SEO>
