<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  // Auth state
  let isAuthenticated = $derived(data.authenticated || false);
  let loginPassword = $state('');
  let loginError = $state('');
  let loggingIn = $state(false);
  
  // State
  let activeTab = $state('manga');
  let loading = $state(false);
  let mangaList = $state<any[]>([]);
  let stats = $state<any>(null);
  let selectedManga = $state<any>(null);
  
  // Form state
  let showAddMangaModal = $state(false);
  let showEditMangaModal = $state(false);
  let showAddChapterModal = $state(false);
  let showUploadPagesModal = $state(false);
  let uploading = $state(false);
  let uploadingPages = $state(false);
  let newManga = $state({
    title: '',
    description: '',
    cover: '',
    status: 'ongoing',
    type: 'manga',
    author: '',
    tags: ''
  });
  let editManga = $state({
    id: 0,
    title: '',
    description: '',
    cover: '',
    status: 'ongoing',
    type: 'manga',
    demographic: 'shonen',
    author: '',
    artist: '',
    tags: ''
  });
  let newChapter = $state({
    chapter_number: '',
    title: '',
    volume: ''
  });
  let selectedChapter = $state<any>(null);
  let expandedManga = $state<number | null>(null);
  
  // Login function - using server form action
  async function login() {
    if (!loginPassword) return;
    loggingIn = true;
    loginError = '';
    
    // Submit form to server action
    const formData = new FormData();
    formData.append('password', loginPassword);
    
    try {
      const res = await fetch('?/login', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      // If success, reload to get new session
      if (data.type === 'success') {
        window.location.reload();
      } else {
        loginError = 'Invalid password';
      }
    } catch (e) {
      loginError = 'Connection error';
    } finally {
      loggingIn = false;
    }
  }
  
  // Logout function - using server form action
  async function logout() {
    const formData = new FormData();
    formData.append('action', 'logout');
    
    await fetch('?/logout', {
      method: 'POST',
      body: formData
    });
    
    window.location.reload();
  }
  
  // Load data
  async function loadData() {
    loading = true;
    try {
      const res = await fetch('/api/admin/manga');
      const data = await res.json();
      if (data.success) {
        mangaList = data.data.manga;
        stats = data.data.stats;
      }
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadData();
  });
  
  // Upload cover image
  async function uploadCover(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    uploading = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        newManga.cover = data.data.url;
      } else {
        alert('Error uploading: ' + data.error);
      }
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed');
    } finally {
      uploading = false;
    }
  }
  
  // Create manga
  async function createManga() {
    try {
      const res = await fetch('/api/admin/manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newManga,
          tags: newManga.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.success) {
        showAddMangaModal = false;
        newManga = { title: '', description: '', cover: '', status: 'ongoing', type: 'manga', author: '', tags: '' };
        loadData();
      }
    } catch (e) {
      console.error('Failed to create manga:', e);
    }
  }
  
  // Create chapter
  async function createChapter() {
    if (!selectedManga) return;
    
    try {
      const res = await fetch(`/api/admin/manga/${selectedManga.id}/chapter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChapter)
      });
      const data = await res.json();
      if (data.success) {
        showAddChapterModal = false;
        newChapter = { chapter_number: '', title: '', volume: '' };
        loadData();
      }
    } catch (e) {
      console.error('Failed to create chapter:', e);
    }
  }
  
  // Delete manga
  async function deleteManga(id: number) {
    if (!confirm('Are you sure you want to delete this manga? All chapters and pages will be deleted.')) return;
    
    try {
      await fetch(`/api/admin/manga/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  }
  
  // Open edit manga modal
  function openEditModal(manga: any) {
    editManga = {
      id: manga.id,
      title: manga.title || '',
      description: manga.description || '',
      cover: manga.cover || '',
      status: manga.status || 'ongoing',
      type: manga.type || 'manga',
      demographic: manga.demographic || 'shonen',
      author: manga.author || '',
      artist: manga.artist || '',
      tags: Array.isArray(manga.tags) ? manga.tags.join(', ') : ''
    };
    showEditMangaModal = true;
  }
  
  // Upload cover for edit modal
  async function uploadCoverForEdit(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    
    uploading = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        editManga.cover = data.data.url;
      }
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      uploading = false;
    }
  }
  
  // Save edited manga
  async function saveManga() {
    try {
      const res = await fetch(`/api/admin/manga/${editManga.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editManga.title,
          description: editManga.description,
          cover: editManga.cover,
          status: editManga.status,
          type: editManga.type,
          demographic: editManga.demographic,
          author: editManga.author,
          artist: editManga.artist,
          tags: editManga.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showEditMangaModal = false;
        loadData();
      }
    } catch (e) {
      console.error('Failed to save:', e);
    }
  }
  
  // Delete chapter
  async function deleteChapter(chapterId: number) {
    if (!confirm('Are you sure you want to delete this chapter? All pages will be deleted.')) return;
    
    try {
      await fetch(`/api/admin/chapter/${chapterId}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('Failed to delete chapter:', e);
    }
  }
  
  // Upload chapter pages
  async function uploadChapterPages(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0 || !selectedChapter) return;
    
    uploadingPages = true;
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      
      const res = await fetch(`/api/admin/chapter/${selectedChapter.id}/pages`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Successfully uploaded ${data.data.pagesCount} pages!`);
        showUploadPagesModal = false;
        selectedChapter = null;
        loadData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Upload failed');
    } finally {
      uploadingPages = false;
    }
  }
  
  // Open upload pages modal for a chapter
  function openUploadPages(chapter: any) {
    selectedChapter = chapter;
    showUploadPagesModal = true;
  }
  
  // Toggle manga expansion
  function toggleManga(id: number) {
    expandedManga = expandedManga === id ? null : id;
  }
</script>

<!-- Login Screen -->
{#if !isAuthenticated}
  <div class="login-container">
    <div class="login-box">
      <div class="login-logo">MANHAU</div>
      <p class="login-subtitle">Enter password to continue</p>
      
      <form onsubmit={(e) => { e.preventDefault(); login(); }}>
        <input 
          type="password" 
          bind:value={loginPassword} 
          placeholder="Password"
          class="login-input"
          disabled={loggingIn}
        />
        {#if loginError}
          <p class="login-error">{loginError}</p>
        {/if}
        <button type="submit" class="login-btn" disabled={loggingIn}>
          {loggingIn ? 'Please wait...' : 'CONTINUE'}
        </button>
      </form>
      
      <a href="/" class="login-back">← Back to Home</a>
    </div>
  </div>
{:else}
<div class="admin-container">
  <!-- Header -->
  <header class="admin-header">
    <div class="header-content">
      <h1>📚 Admin Panel</h1>
      <p>Manage your manga, manhwa, and comics library</p>
    </div>
    <button class="logout-btn" onclick={logout}>
      🚪 Logout
    </button>
  </header>
  
  <!-- Stats -->
  {#if stats}
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">{stats.totalManga}</span>
        <span class="stat-label">Total Series</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{stats.totalChapters}</span>
        <span class="stat-label">Chapters</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{stats.mangaByStatus.ongoing}</span>
        <span class="stat-label">Ongoing</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{stats.mangaByStatus.completed}</span>
        <span class="stat-label">Completed</span>
    </div>
  </div>
{/if}

<!-- Upload Pages Modal -->
{#if showUploadPagesModal && selectedChapter}
  <div class="modal-overlay" onclick={() => showUploadPagesModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Upload Pages - Chapter {selectedChapter.chapter_number}</h2>
        <button class="close-btn" onclick={() => showUploadPagesModal = false}>×</button>
      </div>
      
      <form class="modal-form" onsubmit={(e) => { e.preventDefault(); }}>
        <div class="form-group">
          <label>Chapter Images</label>
          <div class="pages-upload">
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onchange={uploadChapterPages}
              disabled={uploadingPages}
              id="pages-upload"
            />
            <label for="pages-upload">
              {#if uploadingPages}
                ⏳ Uploading...
              {:else}
                📁 Click to select page images
              {/if}
            </label>
            <p class="upload-hint">Select multiple images (JPG, PNG, WebP, GIF)</p>
            <p class="upload-hint">Images will be ordered by filename</p>
          </div>
        </div>
        
        {#if selectedChapter.pages > 0}
          <div class="form-group">
            <label>Current Pages: {selectedChapter.pages}</label>
            <p class="form-hint">Uploading new pages will add to existing ones</p>
          </div>
        {/if}
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={() => showUploadPagesModal = false}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
  
  <!-- Tabs -->
  <div class="tabs">
    <button 
      class="tab" 
      class:active={activeTab === 'manga'}
      onclick={() => activeTab = 'manga'}
    >
      📖 Manga List
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'upload'}
      onclick={() => activeTab = 'upload'}
    >
      📤 Upload Content
    </button>
  </div>
  
  <!-- Content -->
  <div class="tab-content">
    {#if activeTab === 'manga'}
      <div class="manga-list">
        <div class="list-header">
          <h2>All Series ({mangaList.length})</h2>
          <button class="btn-primary" onclick={() => showAddMangaModal = true}>
            + Add New Series
          </button>
        </div>
        
        {#if loading}
          <div class="loading">Loading...</div>
        {:else if mangaList.length === 0}
          <div class="empty-state">
            <p>No manga found. Add your first series!</p>
          </div>
        {:else}
          <div class="manga-table">
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Chapters</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each mangaList as manga}
                  <tr>
                    <td>
                      {#if manga.cover}
                        <img src={manga.cover} alt={manga.title} class="cover-thumb" />
                      {:else}
                        <div class="no-cover">No Cover</div>
                      {/if}
                    </td>
                    <td class="title-cell">{manga.title}</td>
                    <td>{manga.author || 'Unknown'}</td>
                    <td>
                      <span class="status-badge status-{manga.status}">{manga.status}</span>
                    </td>
                    <td>{manga.chapters?.length || 0}</td>
                    <td>{new Date(manga.created_at).toLocaleDateString()}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="btn-sm btn-add" onclick={() => { selectedManga = manga; showAddChapterModal = true; showUploadPagesModal = false; }}>
                          + Chapter
                        </button>
                        <button class="btn-sm btn-edit" onclick={() => openEditModal(manga)}>
                          Edit
                        </button>
                        <button class="btn-sm btn-delete" onclick={() => deleteManga(manga.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Chapters row - always visible -->
                  {#if manga.chapters && manga.chapters.length > 0}
                    <tr class="chapters-row">
                      <td colspan="7">
                        <div class="chapters-section">
                          <div class="chapters-list">
                            {#each manga.chapters as chapter}
                              <div class="chapter-item">
                                <div class="chapter-info">
                                  <span class="chapter-num">Ch. {chapter.chapter_number}</span>
                                  {#if chapter.title}
                                    <span class="chapter-title">{chapter.title}</span>
                                  {/if}
                                  <span class="chapter-pages">{chapter.pages} pages</span>
                                </div>
                                <div class="chapter-actions">
                                  <button 
                                    class="btn-sm btn-upload"
                                    onclick={() => openUploadPages(chapter)}
                                  >
                                    {chapter.pages > 0 ? 'Add Pages' : 'Upload'}
                                  </button>
                                  <button 
                                    class="btn-sm btn-delete"
                                    onclick={() => deleteChapter(chapter.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            {/each}
                          </div>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'upload'}
      <div class="upload-section">
        <h2>Upload New Content</h2>
        
        <div class="upload-cards">
          <div class="upload-card">
            <div class="upload-icon">📚</div>
            <h3>Add New Series</h3>
            <p>Create a new manga, manhwa, or comic series</p>
            <button class="btn-primary" onclick={() => showAddMangaModal = true}>
              Start
            </button>
          </div>
          
          <div class="upload-card">
            <div class="upload-icon">📄</div>
            <h3>Upload Chapters</h3>
            <p>Add chapters to existing series</p>
            <button class="btn-primary" onclick={() => activeTab = 'manga'}>
              Go to List
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Add Manga Modal -->
{#if showAddMangaModal}
  <div class="modal-overlay" onclick={() => showAddMangaModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Add New Series</h2>
        <button class="close-btn" onclick={() => showAddMangaModal = false}>×</button>
      </div>
      
      <form class="modal-form" onsubmit={(e) => { e.preventDefault(); createManga(); }}>
        <!-- Cover Upload -->
        <div class="cover-upload-section">
          <label>Cover Image</label>
          
          {#if newManga.cover}
            <div class="cover-preview">
              <img src={newManga.cover} alt="Cover preview" />
              <button type="button" class="remove-cover" onclick={() => newManga.cover = ''}>×</button>
            </div>
          {:else}
            <div class="cover-upload">
              <input 
                type="file" 
                accept="image/*" 
                onchange={uploadCover}
                disabled={uploading}
                id="cover-upload"
              />
              <label for="cover-upload">
                {#if uploading}
                  ⏳ Uploading...
                {:else}
                  📁 Click to upload cover
                {/if}
              </label>
              <p class="upload-hint">or enter URL below</p>
            </div>
          {/if}
          
          <input 
            type="url" 
            placeholder="Or paste image URL..."
            bind:value={newManga.cover}
            class="cover-url-input"
          />
        </div>
        
        <div class="form-group">
          <label for="title">Title *</label>
          <input type="text" id="title" bind:value={newManga.title} required />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" bind:value={newManga.description} rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="author">Author</label>
            <input type="text" id="author" bind:value={newManga.author} />
          </div>
          
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" bind:value={newManga.status}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="type">Type</label>
            <select id="type" bind:value={newManga.type}>
              <option value="manga">Manga (Japanese)</option>
              <option value="manhwa">Manhwa (Korean)</option>
              <option value="manhua">Manhua (Chinese)</option>
              <option value="comic">Comic</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags (comma separated)</label>
          <input type="text" id="tags" bind:value={newManga.tags} placeholder="Action, Adventure, Fantasy" />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={() => showAddMangaModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Create Series
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Manga Modal -->
{#if showEditMangaModal}
  <div class="modal-overlay" onclick={() => showEditMangaModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Edit Manga</h2>
        <button class="close-btn" onclick={() => showEditMangaModal = false}>×</button>
      </div>
      
      <form class="modal-form" onsubmit={(e) => { e.preventDefault(); saveManga(); }}>
        <!-- Cover Upload -->
        <div class="cover-upload-section">
          <label>Cover Image</label>
          
          {#if editManga.cover}
            <div class="cover-preview">
              <img src={editManga.cover} alt="Cover preview" />
              <button type="button" class="remove-cover" onclick={() => editManga.cover = ''}>×</button>
            </div>
          {:else}
            <div class="cover-upload">
              <input 
                type="file" 
                accept="image/*" 
                onchange={uploadCoverForEdit}
                disabled={uploading}
                id="edit-cover-upload"
              />
              <label for="edit-cover-upload">
                {#if uploading}
                  ⏳ Uploading...
                {:else}
                  📁 Click to upload cover
                {/if}
              </label>
            </div>
          {/if}
          
          <input 
            type="url" 
            placeholder="Or paste image URL..."
            bind:value={editManga.cover}
            class="cover-url-input"
          />
        </div>
        
        <div class="form-group">
          <label for="edit-title">Title *</label>
          <input type="text" id="edit-title" bind:value={editManga.title} required />
        </div>
        
        <div class="form-group">
          <label for="edit-description">Description</label>
          <textarea id="edit-description" bind:value={editManga.description} rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-author">Author</label>
            <input type="text" id="edit-author" bind:value={editManga.author} />
          </div>
          
          <div class="form-group">
            <label for="edit-artist">Artist</label>
            <input type="text" id="edit-artist" bind:value={editManga.artist} />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-status">Status</label>
            <select id="edit-status" bind:value={editManga.status}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-type">Type</label>
            <select id="edit-type" bind:value={editManga.type}>
              <option value="manga">Manga (Japanese)</option>
              <option value="manhwa">Manhwa (Korean)</option>
              <option value="manhua">Manhua (Chinese)</option>
              <option value="comic">Comic</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-demographic">Demographic</label>
            <select id="edit-demographic" bind:value={editManga.demographic}>
              <option value="shonen">Shonen</option>
              <option value="shoujo">Shoujo</option>
              <option value="seinen">Seinen</option>
              <option value="josei">Josei</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-tags">Tags (comma separated)</label>
            <input type="text" id="edit-tags" bind:value={editManga.tags} placeholder="Action, Adventure, Fantasy" />
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={() => showEditMangaModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Add Chapter Modal -->
{#if showAddChapterModal && selectedManga}
  <div class="modal-overlay" onclick={() => showAddChapterModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Add Chapter to {selectedManga.title}</h2>
        <button class="close-btn" onclick={() => showAddChapterModal = false}>×</button>
      </div>
      
      <form class="modal-form" onsubmit={(e) => { e.preventDefault(); createChapter(); }}>
        <div class="form-row">
          <div class="form-group">
            <label for="chapter_number">Chapter Number *</label>
            <input type="text" id="chapter_number" bind:value={newChapter.chapter_number} required placeholder="1" />
          </div>
          
          <div class="form-group">
            <label for="volume">Volume</label>
            <input type="text" id="volume" bind:value={newChapter.volume} placeholder="1" />
          </div>
        </div>
        
        <div class="form-group">
          <label for="chapter_title">Chapter Title</label>
          <input type="text" id="chapter_title" bind:value={newChapter.title} placeholder="The beginning" />
        </div>
        
        <div class="form-group">
          <label>Pages</label>
          <p class="form-hint">After creating the chapter, you can upload pages from the manga list</p>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" onclick={() => showAddChapterModal = false}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            Create Chapter
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .admin-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-content h1 { margin: 0 0 8px 0; font-size: 2rem; }
  .header-content p { margin: 0; opacity: 0.9; }
  
  .logout-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: #1a1a24;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    border: 1px solid #2a2a3a;
  }
  
  .stat-number { display: block; font-size: 2.5rem; font-weight: bold; color: #8b5cf6; }
  .stat-label { color: #9ca3af; font-size: 0.875rem; }
  
  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid #2a2a3a;
    padding-bottom: 8px;
  }
  
  .tab {
    padding: 12px 24px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
  }
  
  .tab:hover { background: #1a1a24; }
  .tab.active { background: #8b5cf6; color: white; }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .btn-primary {
    background: #8b5cf6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .btn-primary:hover { background: #7c3aed; }
  
  .btn-secondary {
    background: #1a1a24;
    color: #e5e5e5;
    border: 1px solid #2a2a3a;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
  }
  
  .cover-thumb {
    width: 40px;
    height: 56px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .no-cover {
    width: 40px;
    height: 56px;
    background: #12121a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    color: #9ca3af;
    border-radius: 4px;
  }
  
  .title-cell { font-weight: 500; color: #e5e5e5; }
  
  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .status-ongoing { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .status-completed { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  .status-hiatus { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
  .status-cancelled { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  
  .action-buttons { display: flex; gap: 8px; }
  
  .btn-sm {
    padding: 6px 12px;
    font-size: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
  }
  
  .btn-edit { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
  .btn-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  
  .empty-state, .loading { text-align: center; padding: 60px 20px; color: #9ca3af; }
  
  .upload-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
  
  .upload-card {
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
  }
  
  .upload-icon { font-size: 3rem; margin-bottom: 16px; }
  .upload-card h3 { margin: 0 0 8px 0; }
  .upload-card p { color: #9ca3af; margin: 0 0 20px 0; }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .modal {
    background: #1a1a24;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #2a2a3a;
  }
  
  .modal-header h2 { margin: 0; }
  
  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .modal-form { padding: 20px; }
  
  .form-group { margin-bottom: 16px; }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.875rem;
    color: #9ca3af;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    background: #12121a;
    border: 1px solid #2a2a3a;
    border-radius: 8px;
    color: #e5e5e5;
    font-size: 1rem;
  }
  
  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
    outline: none;
    border-color: #8b5cf6;
  }
  
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  
  .form-hint { font-size: 0.75rem; color: #9ca3af; margin: 0; }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
  
  /* Cover Upload */
  .cover-upload-section { margin-bottom: 20px; }
  .cover-upload-section label { display: block; margin-bottom: 8px; font-size: 0.875rem; color: #9ca3af; }
  
  .cover-preview {
    position: relative;
    width: 120px;
    height: 168px;
    margin-bottom: 10px;
  }
  
  .cover-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .remove-cover {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
  }
  
  .cover-upload {
    position: relative;
    border: 2px dashed #2a2a3a;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .cover-upload input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  
  .cover-upload label {
    color: #9ca3af;
    cursor: pointer;
    display: block;
  }
  
  .upload-hint {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 8px 0 0 0;
  }
  
  .cover-url-input { width: 100%; }
  
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #2a2a3a; }
  th { color: #9ca3af; font-weight: 500; font-size: 0.875rem; }
  
  /* Expand button */
  .expand-btn {
    background: none;
    border: none;
    color: #e5e5e5;
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    padding: 0;
  }
  
  .expand-btn:hover { color: #8b5cf6; }
  
  /* Chapters row */
  .chapters-row td {
    background: #12121a;
    padding: 0;
  }
  
  .chapters-section {
    padding: 16px 20px;
  }
  
  .chapters-section h4 {
    margin: 0 0 12px 0;
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .chapters-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .chapter-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1a1a24;
    padding: 10px 14px;
    border-radius: 8px;
  }
  
  .chapter-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .chapter-num {
    font-weight: 500;
    color: #e5e5e5;
  }
  
  .chapter-title {
    color: #9ca3af;
    font-size: 0.875rem;
  }
  
  .chapter-pages {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  .chapter-actions {
    display: flex;
    gap: 8px;
  }
  
  .btn-upload {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    padding: 6px 12px;
    font-size: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
  }
  
  .btn-upload:hover {
    background: rgba(16, 185, 129, 0.3);
  }
  
  .btn-add {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 6px 12px;
    font-size: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
  }
  
  .btn-add:hover {
    background: rgba(59, 130, 246, 0.3);
  }
  
  .no-chapters {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }
  
  /* Pages upload */
  .pages-upload {
    position: relative;
    border: 2px dashed #2a2a3a;
    border-radius: 8px;
    padding: 32px;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .pages-upload input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  
  .pages-upload label {
    color: #9ca3af;
    cursor: pointer;
    display: block;
  }
  
  /* Login styles */
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0f172a;
    padding: 20px;
  }
  
  .login-box {
    width: 100%;
    max-width: 320px;
    text-align: center;
  }
  
  .login-logo {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    letter-spacing: 0.1em;
  }
  
  .login-subtitle {
    color: #94a3b8;
    font-size: 0.875rem;
    margin: 0 0 40px 0;
  }
  
  .login-input {
    width: 100%;
    padding: 12px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid #334155;
    color: white;
    font-size: 1rem;
    text-align: center;
    margin-bottom: 24px;
    transition: border-color 0.2s;
  }
  
  .login-input:focus {
    outline: none;
    border-bottom-color: white;
  }
  
  .login-input::placeholder {
    color: #475569;
  }
  
  .login-error {
    color: #ef4444;
    font-size: 0.75rem;
    margin: -16px 0 16px 0;
  }
  
  .login-btn {
    width: 100%;
    padding: 14px;
    background: white;
    color: #0f172a;
    border: none;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    letter-spacing: 0.05em;
  }
  
  .login-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .login-back {
    display: inline-block;
    margin-top: 32px;
    color: #64748b;
    font-size: 0.75rem;
    text-decoration: none;
    transition: color 0.2s;
  }
  
  .login-back:hover {
    color: #94a3b8;
  }
</style>
{/if}
