<script lang="ts">
  import { readerSettings } from '$lib/stores/reader-settings';
  
  let isOpen = $state(false);
  
  const bgColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Gray', value: '#1a1a1a' },
    { name: 'Sepia', value: '#f4ecd8' },
    { name: 'White', value: '#ffffff' }
  ];
  
  const textColors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Light Gray', value: '#cccccc' },
    { name: 'Dark', value: '#333333' },
    { name: 'Black', value: '#000000' }
  ];
  
  function handleBackgroundChange(color: string) {
    readerSettings.update(s => ({ ...s, backgroundColor: color }));
  }
  
  function handleTextColorChange(color: string) {
    readerSettings.update(s => ({ ...s, textColor: color }));
  }
  
  function handleFontSizeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    readerSettings.update(s => ({ ...s, fontSize: Number(target.value) }));
  }
  
  function handleBrightnessChange(e: Event) {
    const target = e.target as HTMLInputElement;
    readerSettings.update(s => ({ ...s, brightness: Number(target.value) }));
  }
  
  function toggleMode() {
    readerSettings.update(s => ({ 
      ...s, 
      readingMode: s.readingMode === 'vertical' ? 'horizontal' : 'vertical' 
    }));
  }
  
  function togglePageNumber() {
    readerSettings.update(s => ({ ...s, showPageNumber: !s.showPageNumber }));
  }
</script>

<!-- Toggle Button -->
<button 
  class="settings-toggle"
  onclick={() => isOpen = !isOpen}
  aria-label="Reader settings"
  title="Settings"
>
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
</button>

<!-- Settings Panel -->
{#if isOpen}
  <div class="settings-overlay" onclick={() => isOpen = false} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}></div>
  <div class="settings-panel" role="dialog" aria-label="Reader settings">
    <div class="settings-header">
      <h3>Reading Settings</h3>
      <button class="close-btn" onclick={() => isOpen = false} aria-label="Close settings">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <div class="settings-content">
      <!-- Background Color -->
      <div class="setting-group">
        <label>Background</label>
        <div class="color-options">
          {#each bgColors as color}
            <button 
              class="color-btn"
              class:active={$readerSettings.backgroundColor === color.value}
              style="background-color: {color.value}"
              onclick={() => handleBackgroundChange(color.value)}
              title={color.name}
              aria-label={color.name}
            ></button>
          {/each}
        </div>
      </div>
      
      <!-- Text Color -->
      <div class="setting-group">
        <label>Text Color</label>
        <div class="color-options">
          {#each textColors as color}
            <button 
              class="color-btn"
              class:active={$readerSettings.textColor === color.value}
              style="background-color: {color.value}"
              onclick={() => handleTextColorChange(color.value)}
              title={color.name}
              aria-label={color.name}
            ></button>
          {/each}
        </div>
      </div>
      
      <!-- Font Size -->
      <div class="setting-group">
        <label>Font Size: {$readerSettings.fontSize}px</label>
        <input 
          type="range" 
          min="12" 
          max="24" 
          value={$readerSettings.fontSize}
          oninput={handleFontSizeChange}
          class="slider"
        />
      </div>
      
      <!-- Brightness -->
      <div class="setting-group">
        <label>Brightness: {$readerSettings.brightness}%</label>
        <input 
          type="range" 
          min="50" 
          max="150" 
          value={$readerSettings.brightness}
          oninput={handleBrightnessChange}
          class="slider"
        />
      </div>
      
      <!-- Reading Mode -->
      <div class="setting-group">
        <label>Reading Mode</label>
        <div class="mode-buttons">
          <button 
            class="mode-btn"
            class:active={$readerSettings.readingMode === 'vertical'}
            onclick={() => readerSettings.update(s => ({ ...s, readingMode: 'vertical' }))}
          >
            Vertical
          </button>
          <button 
            class="mode-btn"
            class:active={$readerSettings.readingMode === 'horizontal'}
            onclick={() => readerSettings.update(s => ({ ...s, readingMode: 'horizontal' }))}
          >
            Horizontal
          </button>
        </div>
      </div>
      
      <!-- Show Page Number -->
      <div class="setting-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            checked={$readerSettings.showPageNumber}
            onchange={togglePageNumber}
          />
          <span>Show page number</span>
        </label>
      </div>
      
      <!-- Reset -->
      <button class="reset-btn" onclick={() => readerSettings.reset()}>
        Reset to defaults
      </button>
    </div>
  </div>
{/if}

<style>
  .settings-toggle {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 60;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .settings-toggle:hover {
    background: rgba(139, 92, 246, 0.8);
    transform: scale(1.05);
  }
  
  .settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 70;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .settings-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 80;
    width: 90%;
    max-width: 400px;
    background: #1a1a24;
    border-radius: 16px;
    border: 1px solid #2a2a3a;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #2a2a3a;
  }
  
  .settings-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
  }
  
  .close-btn:hover {
    color: white;
  }
  
  .settings-content {
    padding: 20px;
  }
  
  .setting-group {
    margin-bottom: 20px;
  }
  
  .setting-group label {
    display: block;
    color: #9ca3af;
    font-size: 0.875rem;
    margin-bottom: 8px;
  }
  
  .color-options {
    display: flex;
    gap: 10px;
  }
  
  .color-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .color-btn:hover {
    transform: scale(1.1);
  }
  
  .color-btn.active {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
  }
  
  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #2a2a3a;
    appearance: none;
    cursor: pointer;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
  }
  
  .mode-buttons {
    display: flex;
    gap: 10px;
  }
  
  .mode-btn {
    flex: 1;
    padding: 10px;
    background: #2a2a3a;
    border: none;
    border-radius: 8px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .mode-btn.active {
    background: #8b5cf6;
    color: white;
  }
  
  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  
  .checkbox-label input {
    width: 18px;
    height: 18px;
    accent-color: #8b5cf6;
  }
  
  .reset-btn {
    width: 100%;
    padding: 12px;
    background: transparent;
    border: 1px solid #2a2a3a;
    border-radius: 8px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 10px;
  }
  
  .reset-btn:hover {
    border-color: #8b5cf6;
    color: #8b5cf6;
  }
</style>
