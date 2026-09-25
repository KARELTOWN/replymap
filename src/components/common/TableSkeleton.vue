<template>
    <div class="space-y-2" role="status" aria-live="polite" aria-busy="true">
        <span class="sr-only">Chargement en cours</span>
        <div v-for="row in rows" :key="row"
            class="flex items-center gap-4 rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800">
            <div v-for="column in columns" :key="column"
                class="h-3 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]"
                :style="{ width: widthFor(column) }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Waiting is drawn with the shape of the content to come, rather than a
// "Loading" banner that made the layout jump on every page change.
const props = withDefaults(defineProps<{ rows?: number; columns?: number }>(), {
    rows: 5,
    columns: 4,
})

// Uneven widths look like real data and avoid a regular checkerboard
// effect.
const WIDTHS = ['32%', '18%', '22%', '14%', '20%', '12%']
const widthFor = (column: number) => WIDTHS[(column - 1) % WIDTHS.length]
</script>
