<script lang="ts">
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user';

  interface Comment {
    id: number;
    user_name: string;
    content: string;
    created_at: string;
  }

  interface Props {
    mangaId: number;
  }

  let { mangaId }: Props = $props();
  
  let comments = $state<Comment[]>([]);
  let loading = $state(true);
  let submitting = $state(false);
  let newComment = $state('');
  let userName = $state('');

  onMount(async () => {
    await userStore.init();
    await loadComments();
  });

  async function loadComments() {
    loading = true;
    comments = await userStore.loadComments(mangaId);
    loading = false;
  }

  async function submitComment() {
    if (!newComment.trim() || submitting) return;
    
    submitting = true;
    const comment = await userStore.postComment(mangaId, newComment.trim(), userName.trim() || undefined);
    
    if (comment) {
      comments = [comment, ...comments];
      newComment = '';
    }
    
    submitting = false;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
</script>

<div class="comments-section">
  <h3 class="comments-title">Comments ({comments.length})</h3>
  
  <!-- Comment Form -->
  <form class="comment-form" onsubmit={(e) => { e.preventDefault(); submitComment(); }}>
    <input
      type="text"
      bind:value={userName}
      placeholder="Your name (optional)"
      class="comment-name-input"
    />
    <textarea
      bind:value={newComment}
      placeholder="Write a comment..."
      class="comment-textarea"
      rows="3"
      disabled={submitting}
    ></textarea>
    <button
      type="submit"
      class="comment-submit-btn"
      disabled={!newComment.trim() || submitting}
    >
      {submitting ? 'Posting...' : 'Post Comment'}
    </button>
  </form>
  
  <!-- Comments List -->
  {#if loading}
    <div class="comments-loading">Loading comments...</div>
  {:else if comments.length === 0}
    <div class="comments-empty">
      <p>No comments yet. Be the first to comment!</p>
    </div>
  {:else}
    <div class="comments-list">
      {#each comments as comment}
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">{comment.user_name || 'Anonymous'}</span>
            <span class="comment-date">{formatDate(comment.created_at)}</span>
          </div>
          <p class="comment-content">{comment.content}</p>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .comments-section {
    background: var(--color-bg-card, #1a1a24);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--color-border, #2a2a3a);
    margin-top: 24px;
  }

  .comments-title {
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 16px 0;
  }

  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .comment-name-input {
    padding: 10px 12px;
    background: var(--color-bg-secondary, #12121a);
    border: 1px solid var(--color-border, #2a2a3a);
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
  }

  .comment-name-input:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
  }

  .comment-textarea {
    padding: 10px 12px;
    background: var(--color-bg-secondary, #12121a);
    border: 1px solid var(--color-border, #2a2a3a);
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    resize: vertical;
    min-height: 80px;
  }

  .comment-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #6366f1);
  }

  .comment-submit-btn {
    padding: 10px 20px;
    background: var(--color-primary, #6366f1);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-end;
  }

  .comment-submit-btn:hover:not(:disabled) {
    background: #5558e3;
  }

  .comment-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .comments-loading,
  .comments-empty {
    text-align: center;
    padding: 30px;
    color: var(--color-text-muted, #9ca3af);
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .comment-item {
    padding: 14px;
    background: var(--color-bg-secondary, #12121a);
    border-radius: 8px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .comment-author {
    color: white;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .comment-date {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.75rem;
  }

  .comment-content {
    color: var(--color-text-muted, #9ca3af);
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
  }
</style>
