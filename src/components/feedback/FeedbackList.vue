<template>
    <!-- Same reading as the other lists: a bordered card, a row that reacts to
         the pointer, and the status as a coloured pill rather than a badge that
         was the same colour for every state. -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
            <thead>
                <tr class="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th class="px-4 py-3">Titre</th>
                    <th class="hidden sm:table-cell px-4 py-3">Type</th>
                    <th class="hidden lg:table-cell px-4 py-3">Auteur</th>
                    <th class="px-4 py-3">Statut</th>
                    <th class="hidden md:table-cell px-4 py-3">Créé le</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="row in rows" :key="row._id"
                    class="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    @click="openFeedback(row._id)" title="Ouvrir le feedback">
                    <td class="max-w-[320px] truncate px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90"
                        :title="row.title">{{ row.title }}</td>
                    <td class="hidden sm:table-cell px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ row.type?.libelle }}</td>
                    <td class="hidden lg:table-cell px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span :title="authorOf(row).email">{{ authorOf(row).name }}</span>
                        <span v-if="authorOf(row).guest"
                            class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                            invité
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span
                            class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                            {{ row.status?.libelle }}
                        </span>
                    </td>
                    <td class="hidden md:table-cell px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatTimestampToDate(row.createdAt) }}</td>
                </tr>
                <tr v-if="rows.length === 0">
                    <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Aucun feedback</td>
                </tr>
            </tbody>
        </table>
        </div>
    </div>

    <FeedbackModal :open="showModal" @close="closeModal" :feedback="feedbackSelect" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import FeedbackModal from './modal/FeedbackModal.vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts'
import { formatTimestampToDate } from '@/utils/format'
import { feedbackAuthor } from '@/utils/authorLabel'

const storeFeedback = feedbackStore()
const { feedbacks, feedbackSelect, search_form } = storeToRefs(storeFeedback)
const { resetFeedbackSelectData } = storeFeedback

const showModal = ref(false)

// Members and guests are named the same way across the board and the table.
const authorOf = (row: any) => feedbackAuthor(row)

// `feedbacks` is grouped by status by the API (one entry per status with its
// feedback list): it is flattened into one sorted list for the table view, and
// filtered client side by status when that filter is active.
const rows = computed(() => {
    const flattened = (feedbacks.value || []).flatMap((group: any) =>
        (group.feedbacks || []).map((feedback: any) => ({ ...feedback, status: group.status }))
    )
    const filtered = search_form.value.status
        ? flattened.filter((row: any) => row.status?._id === search_form.value.status)
        : flattened
    return filtered.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
})

function openFeedback(feedback_id: any) {
    feedbackSelect.value = feedback_id
    showModal.value = true
}

function closeModal() {
    resetFeedbackSelectData()
    showModal.value = false
}
</script>
