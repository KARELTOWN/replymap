<template>
  <!-- One shell for every dialog: a title, a scrolling body and a footer that
       stays in view. Each modal used to lay out its own header and footer, so
       the padding, the title size and the place of the actions changed from one
       to the next, and a long form pushed its buttons out of reach. -->
  <div class="fixed inset-0 z-99999 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]" aria-hidden="true" @click="$emit('close')"></div>

    <div
      class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-gray-900 sm:mx-4 sm:max-h-[88vh] sm:rounded-2xl"
      :class="widthClass">
      <header class="flex shrink-0 items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">{{ title }}</h2>
          <p v-if="description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
        </div>
        <button type="button" aria-label="Fermer" @click="$emit('close')"
          class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/[0.06]">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <slot />
      </div>

      <footer v-if="$slots.footer"
        class="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ title: string; description?: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
)

defineEmits<{ (e: 'close'): void }>()

const widthClass = computed(
  () => ({ sm: 'sm:max-w-md', md: 'sm:max-w-2xl', lg: 'sm:max-w-4xl' })[props.size],
)
</script>
