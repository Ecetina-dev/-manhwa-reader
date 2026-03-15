<script lang="ts">
  let { children } = $props();
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
  <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="/" class="text-xl font-bold text-white hover:text-purple-400 transition-colors">
      ManhwaReader
    </a>
    <nav class="flex gap-4">
      <a href="/" class="text-gray-300 hover:text-white transition-colors">Home</a>
    </nav>
  </div>
</header>

<main class="pt-14 min-h-screen">
  {@render children()}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
