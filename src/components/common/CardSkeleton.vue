<template>
  <!-- Waiting drawn with the shape of the cards to come, so the page does not
       jump when they arrive. -->
  <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
    <li v-for="card in count" :key="card"
      class="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800"></div>
      <div class="mt-2 h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800/60"></div>
      <div class="mt-6 h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800/60"></div>
      <div class="mt-5 flex gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div class="h-7 w-20 rounded-lg bg-gray-100 dark:bg-gray-800/60"></div>
        <div class="h-7 w-24 rounded-lg bg-gray-100 dark:bg-gray-800/60"></div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 3 })
</script>
