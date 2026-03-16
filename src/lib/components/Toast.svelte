<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  
  let toasts = $state<Toast[]>([]);
  let nextId = 0;
  
  export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = nextId++;
    toasts = [...toasts, { id, message, type }];
    
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 4000);
  }
  
  export function success(message: string) {
    showToast(message, 'success');
  }
  
  export function error(message: string) {
    showToast(message, 'error');
  }
  
  export function info(message: string) {
    showToast(message, 'info');
  }
</script>

{#if toasts.length > 0}
  <div class="toast-container" aria-live="polite">
    {#each toasts as toast (toast.id)}
      <div class="toast toast-{toast.type}" role="alert">
        <span class="toast-icon">
          {#if toast.type === 'success'}
            ✓
          {:else if toast.type === 'error'}
            ✕
          {:else}
            ℹ
          {/if}
        </span>
        <span class="toast-message">{toast.message}</span>
        <button 
          class="toast-close" 
          onclick={() => toasts = toasts.filter(t => t.id !== toast.id)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  }
  
  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 10px;
    background: #1a1a24;
    border: 1px solid #2a2a3a;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s ease;
    color: white;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .toast-success {
    border-left: 4px solid #34d399;
  }
  
  .toast-error {
    border-left: 4px solid #f87171;
  }
  
  .toast-info {
    border-left: 4px solid #60a5fa;
  }
  
  .toast-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }
  
  .toast-success .toast-icon {
    background: rgba(52, 211, 153, 0.2);
    color: #34d399;
  }
  
  .toast-error .toast-icon {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }
  
  .toast-info .toast-icon {
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
  }
  
  .toast-message {
    flex: 1;
    font-size: 0.9rem;
  }
  
  .toast-close {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  
  .toast-close:hover {
    color: white;
  }
</style>
