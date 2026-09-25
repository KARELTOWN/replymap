<template>
    <div class="overflow-x-auto pb-2">
        <div class="flex min-w-max gap-4">
            <section v-for="column in columns" :key="column.status._id"
                class="flex w-[80vw] max-w-72 shrink-0 flex-col rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03] sm:w-72"
                :class="dragOverStatus === column.status._id ? 'ring-2 ring-brand-400' : ''"
                @dragover.prevent="dragOverStatus = column.status._id" @dragleave="onDragLeave(column.status._id)"
                @drop.prevent="onDrop(column.status._id)">

                <header class="mb-3 flex items-center justify-between px-1">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {{ column.status.libelle }}
                    </h3>
                    <span
                        class="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                        {{ column.feedbacks.length }}
                    </span>
                </header>

                <div class="flex min-h-[80px] flex-col gap-2">
                    <div v-for="feedback in column.feedbacks" :key="feedback._id" draggable="true"
                        @dragstart="onDragStart(feedback, column.status._id)" @dragend="onDragEnd"
                        :class="draggedId === feedback._id ? 'opacity-40' : ''">
                        <FeedbackCard :feedback="feedback" @open="openFeedback" />
                    </div>

                    <p v-if="column.feedbacks.length === 0"
                        class="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
                        Aucun feedback
                    </p>
                </div>
            </section>
        </div>
    </div>

    <FeedbackModal :open="showModal" @close="closeModal" :feedback="feedbackSelect" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import FeedbackCard from './FeedbackCard.vue'
import FeedbackModal from './modal/FeedbackModal.vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore'

const storeFeedback = feedbackStore()
const { feedbacks, feedbackSelect, search_form } = storeToRefs(storeFeedback)
const { updateFeedback, moveFeedbackLocally, resetFeedbackSelectData } = storeFeedback

const showModal = ref(false)
const draggedId = ref<string | null>(null)
const draggedFromStatus = ref<string | null>(null)
const dragOverStatus = ref<string | null>(null)

// The API already returns feedback grouped by status: one column per status,
// empty ones included, so the board keeps the same shape from one visit to the
// next. The type filter is still applied client side.
const columns = computed(() =>
    (feedbacks.value || []).map((group: any) => ({
        status: group.status,
        feedbacks: search_form.value.type
            ? (group.feedbacks || []).filter((item: any) => item.type?._id === search_form.value.type)
            : group.feedbacks || [],
    })),
)

function onDragStart(feedback: any, statusId: string) {
    draggedId.value = feedback._id
    draggedFromStatus.value = statusId
}

function onDragEnd() {
    draggedId.value = null
    draggedFromStatus.value = null
    dragOverStatus.value = null
}

function onDragLeave(statusId: string) {
    if (dragOverStatus.value === statusId) dragOverStatus.value = null
}

// The card moves in the interface right away, then the update goes to the
// API: waiting for the answer would leave the card frozen under the cursor for
// the round trip, while the status change is forwarded to the external tool
// asynchronously afterwards.
async function onDrop(targetStatusId: string) {
    const feedbackId = draggedId.value
    const sourceStatusId = draggedFromStatus.value
    dragOverStatus.value = null

    if (!feedbackId || !sourceStatusId || sourceStatusId === targetStatusId) {
        onDragEnd()
        return
    }

    moveFeedbackLocally(feedbackId, sourceStatusId, targetStatusId)
    onDragEnd()
    await updateFeedback(feedbackId, { status: targetStatusId }, false)
}

function openFeedback(feedbackId: string) {
    feedbackSelect.value = feedbackId
    showModal.value = true
}

function closeModal() {
    resetFeedbackSelectData()
    showModal.value = false
}
</script>
