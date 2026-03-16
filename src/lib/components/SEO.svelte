<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    author?: string;
    tags?: string[];
    publishDate?: string;
    modifiedDate?: string;
    children?: Snippet;
  }

  let { 
    title = 'ManHau - Lector de Manga Online', 
    description = 'Lee manga, manhwa y comics online gratis. Soporte offline con PWA. Miles de títulos actualizados diariamente.',
    image = '/og-image.png',
    url = 'https://manhau.app',
    type = 'website',
    author = 'ManHau',
    tags = [],
    publishDate,
    modifiedDate,
    children 
  }: Props = $props();

  // Build full URL
  const fullUrl = url.startsWith('http') ? url : `https://manhau.app${url}`;
  const fullImage = image.startsWith('http') ? image : `https://manhau.app${image}`;

  // Generate JSON-LD Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ManHau",
    "url": "https://manhau.app",
    "description": "Lector de manga, manhwa y comics online con soporte offline",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://manhau.app/browse?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  // Article schema for manga pages
  const articleSchema = type === 'article' ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": fullImage,
    "url": fullUrl,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "ManHau",
      "logo": {
        "@type": "ImageObject",
        "url": "https://manhau.app/icons/icon.svg"
      }
    },
    "datePublished": publishDate || new Date().toISOString(),
    "dateModified": modifiedDate || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    }
  } : null;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  
  <!-- Keywords -->
  {#if tags.length > 0}
    <meta name="keywords" content={tags.join(', ')} />
  {/if}
  
  <!-- OpenGraph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={fullImage} />
  <meta property="og:url" content={fullUrl} />
  <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
  <meta property="og:site_name" content="ManHau" />
  <meta property="og:locale" content="es_ES" />
  
  {#if publishDate}
    <meta property="article:published_time" content={publishDate} />
  {/if}
  {#if modifiedDate}
    <meta property="article:modified_time" content={modifiedDate} />
  {/if}
  {#if author}
    <meta property="article:author" content={author} />
  {/if}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@manhau" />
  <meta name="twitter:creator" content="@manhau" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={fullImage} />
  <meta name="twitter:url" content={fullUrl} />
  
  <!-- Canonical -->
  <link rel="canonical" href={fullUrl} />
  
  <!-- Alternate languages -->
  <link rel="alternate" hreflang="es" href={fullUrl} />
  <link rel="alternate" hreflang="en" href={fullUrl.replace('manhau.app', 'manhau.app/en')} />
  <link rel="alternate" hreflang="x-default" href={fullUrl} />
  
  <!-- JSON-LD Schema -->
  {@html `<script type="application/ld+json">${JSON.stringify(websiteSchema)}</script>`}
  {#if articleSchema}
    {@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`}
  {/if}
</svelte:head>

{#if children}
  {@render children()}
{/if}
