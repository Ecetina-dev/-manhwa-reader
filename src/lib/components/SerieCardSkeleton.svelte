<script lang="ts">
  import Skeleton from './Skeleton.svelte';
</script>

<div class="skeleton-card">
  <Skeleton variant="card" height="200px" class="mb-3" />
  <Skeleton height="1rem" width="80%" class="mb-2" />
  <Skeleton height="0.75rem" width="60%" />
</div>

<style>
  .skeleton-card {
    width: 100%;
  }
</style>
