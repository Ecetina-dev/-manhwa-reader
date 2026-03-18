<script lang="ts">
  interface Props {
    chapterId: number;
    mangaTitle: string;
    chapterNumber: string;
  }

  let { chapterId, mangaTitle, chapterNumber }: Props = $props();
  
  let downloading = $state(false);
  let downloaded = $state(false);
  let progress = $state(0);
  
  async function downloadChapter() {
    if (downloading || downloaded) return;
    
    downloading = true;
    progress = 0;
    
    try {
      // Fetch chapter pages
      const response = await fetch(`/api/chapter/${chapterId}/pages`);
      const data = await response.json();
      
      if (!data.success || !data.pages) {
        throw new Error('No se pudieron obtener las páginas');
      }
      
      const pages = data.pages;
      const imageUrls = pages.map((p: any) => p.url);
      
      // Create a simple zip-like structure using Cache API
      const cache = await caches.open(`manhau-chapters`);
      
      // Download and cache each image
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        
        try {
          // Fetch the image
          const imgResponse = await fetch(url);
          
          if (imgResponse.ok) {
            // Store in cache with custom key
            await cache.put(
              `manhau-chapter-${chapterId}-page-${i}`,
              imgResponse.clone()
            );
          }
        } catch (err) {
          console.error(`Error downloading page ${i}:`, err);
        }
        
        progress = Math.round(((i + 1) / imageUrls.length) * 100);
      }
      
      // Store metadata
      const metadata = {
        chapterId,
        mangaTitle,
        chapterNumber,
        pageCount: imageUrls.length,
        downloadedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`manhau-ch-${chapterId}-meta`, JSON.stringify(metadata));
      
      downloaded = true;
      console.log(`✅ Chapter ${chapterNumber} downloaded for offline reading`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Error al descargar el capítulo');
    } finally {
      downloading = false;
    }
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
</script>

<button 
  class="download-btn"
  class:downloaded
  onclick={downloadChapter}
  disabled={downloading || downloaded}
  aria-label={downloaded ? 'Capítulo descargado' : 'Descargar capítulo para offline'}
>
  {#if downloading}
    <svg class="spinner" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="30 70" />
    </svg>
    <span>{progress}%</span>
  {:else if downloaded}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Descargado</span>
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Descargar</span>
  {/if}
</button>

{#if downloading}
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
{/if}

<style>
  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #a78bfa;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .download-btn:hover:not(:disabled) {
    background: rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
  
  .download-btn:disabled {
    cursor: not-allowed;
  }
  
  .download-btn.downloaded {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
    color: #34d399;
  }
  
  .download-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .progress-bar {
    margin-top: 8px;
    height: 4px;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #06b6d4);
    transition: width 0.3s ease;
  }
</style>
