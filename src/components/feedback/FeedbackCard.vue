<template>
    <article
        class="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs transition hover:border-brand-300 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500"
        @click="$emit('open', feedback._id)">
        <p class="mb-2 text-sm font-medium leading-snug text-gray-800 dark:text-white/90">
            {{ feedback.title }}
        </p>

        <div class="mb-2 flex flex-wrap items-center gap-1.5">
            <span v-if="feedback.type?.libelle"
                class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                {{ feedback.type.libelle }}
            </span>
        </div>

        <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[11px] text-gray-400 dark:text-gray-500" :title="authorTitle">
                {{ author.name }}<span v-if="author.guest" class="text-gray-400"> (invité)</span>
                · {{ formatTimestampToDate(feedback.createdAt) }}
            </span>

            <!-- Synchronisation state: tells whether the task exists in
                 the external tool, and links straight to it. -->
            <a v-if="feedback.integration_card_url" :href="feedback.integration_card_url" target="_blank"
                rel="noopener noreferrer" @click.stop
                class="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400"
                :title="`Ouvrir la carte ${integrationLabel}`">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"
                        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ integrationLabel }}
            </a>
            <span v-else-if="feedback.integration"
                class="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/[0.06]">
                {{ integrationLabel }}
            </span>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatTimestampToDate } from '@/utils/format'
import { feedbackAuthor } from '@/utils/authorLabel'

const props = defineProps<{ feedback: any }>()
defineEmits<{ (e: 'open', id: string): void }>()

// A guest feedback carries an email instead of an account: it used to show
// "Auteur inconnu", as if nobody had signed it.
const author = computed(() => feedbackAuthor(props.feedback))
const authorTitle = computed(() =>
    author.value.email && author.value.email !== author.value.name
        ? `${author.value.name} · ${author.value.email}`
        : author.value.name,
)

const integrationLabel = computed(() => {
    const name = props.feedback.integration
    if (!name) return ''
    return name.charAt(0).toUpperCase() + name.slice(1)
})
</script>
