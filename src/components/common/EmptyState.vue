<template>
    <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-700">
        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
            <slot name="icon">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
            </slot>
        </div>

        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ title }}</p>
        <p v-if="description" class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {{ description }}
        </p>

        <div v-if="$slots.action" class="mt-4">
            <slot name="action" />
        </div>
    </div>
</template>

<script setup lang="ts">
// Shared empty state: lists showed either nothing at all, or a "No result"
// row lost in a table, without ever saying what to do next.
defineProps<{
    title: string
    description?: string
}>()
</script>
