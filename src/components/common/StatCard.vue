<template>
    <component :is="to ? 'router-link' : 'div'" :to="to"
        class="block rounded-2xl border border-gray-200 bg-white p-5 transition dark:border-gray-800 dark:bg-white/[0.03]"
        :class="to ? 'hover:border-brand-300 hover:shadow-theme-sm dark:hover:border-brand-500' : ''">
        <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
                <p class="mt-2 text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">
                    {{ displayValue }}
                </p>
                <p v-if="hint" class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ hint }}</p>
            </div>

            <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                <slot name="icon" />
            </span>
        </div>
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Key figure tile, shared by the dashboard.
const props = defineProps<{
    label: string
    value: number | string | null | undefined
    hint?: string
    to?: string
}>()

// A missing counter must read as such, not as a blank: dashboard cards showed
// an empty box until the call answered.
const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') return '—'
    return typeof props.value === 'number' ? props.value.toLocaleString('fr-FR') : props.value
})
</script>
