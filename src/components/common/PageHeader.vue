<template>
    <header class="mb-6">
        <nav class="mb-2" aria-label="Fil d'Ariane">
            <ol class="flex items-center gap-1.5 text-sm">
                <li>
                    <router-link to="/" class="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        Accueil
                    </router-link>
                </li>
                <li aria-hidden="true" class="text-gray-300 dark:text-gray-600">/</li>
                <li class="font-medium text-gray-800 dark:text-white/90" aria-current="page">{{ title }}</li>
            </ol>
        </nav>

        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
                <h1 class="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white/90">
                    {{ title }}
                </h1>
                <p v-if="description" class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                    {{ description }}
                </p>
            </div>

            <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
                <slot name="actions" />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
// Single page header for the whole application.
//
// Every screen repeated the breadcrumb and then the card title right below it,
// so the page name appeared twice. Main actions sat in the card body, with no
// fixed place from one screen to the next.
defineProps<{
    title: string
    description?: string
}>()
</script>
