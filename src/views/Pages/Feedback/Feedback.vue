<template>
    <AdminLayout>
        <PageHeader title="Feedbacks"
            description="Les retours de vos testeurs, classés par statut et synchronisés avec Trello." />

        <div class="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
                    <FilterFeedback />

                    <!-- The kanban is the tracking view; the list stays
                         available to scan a large volume or to sort. -->
                    <div class="inline-flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
                        <button type="button" @click="view = 'board'" :class="tabClass('board')">
                            Tableau
                        </button>
                        <button type="button" @click="view = 'list'" :class="tabClass('list')">
                            Liste
                        </button>
                    </div>
                </div>

            <FeedbackBoard v-if="view === 'board'" />
            <FeedbackList v-else />
        </div>
    </AdminLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PageHeader from "@/components/common/PageHeader.vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import FeedbackList from "@/components/feedback/FeedbackList.vue";
import FeedbackBoard from "@/components/feedback/FeedbackBoard.vue";
import FilterFeedback from '@/components/feedback/FilterFeedback.vue'

// The chosen view is kept from one visit to the next: it is a working
// preference, not a navigation state.
const STORAGE_KEY = 'bugreveal_feedback_view'
const stored = localStorage.getItem(STORAGE_KEY)
const view = ref<'board' | 'list'>(stored === 'list' ? 'list' : 'board')

const tabClass = (value: string) =>
    view.value === value
        ? 'rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white'
        : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'

import { watch } from 'vue'
watch(view, (value) => localStorage.setItem(STORAGE_KEY, value))
</script>
