<template>
    <div class="overflow-x-auto h-screen bg-gray-100 p-6">
        <div class="flex space-x-6 min-w-max">
            <!-- Colonne -->
            <div class="w-80 flex-shrink-0 bg-white rounded-lg shadow-md p-4" v-for="(feedback, index) in feedbacks"
                :key="index">
                <h2 class="text-lg font-semibold mb-4 text-gray-700">{{ feedback.status.libelle }}
                    <Badge color="primary">
                        {{ feedback.feedbacks.length }}
                    </Badge>
                </h2>

                <draggable v-model="feedback.feedbacks" @change="onDragChange"
                    :group="{ name: 'feedbacks', pull: true, put: true }" class="min-h-[100px] py-2">
                    <div v-for="(element, indexE) in feedback.feedbacks" :key="indexE">
                        <div class="space-y-4 my-4">
                            <Task :feedback="element" @delete="deleteFeedback" @open-feedback="openFeedback" />
                        </div>
                    </div>
                </draggable>
            </div>

        </div>
    </div>

    <FeedbackModal :open="showModal" @close="closeModal" :feedback="feedbackSelect" />

</template>

<script lang="ts">
import { VueDraggableNext } from 'vue-draggable-next';
import Task from './board/Task.vue';
import FeedbackModal from './modal/FeedbackModal.vue';
import Badge from '../ui/Badge.vue';

import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';

import { storeToRefs } from 'pinia';
import { ref } from 'vue';
const storeFeedback = feedbackStore()
const { updateFeedback } = storeFeedback
import _ from 'lodash'

export default {
    components: {
        draggable: VueDraggableNext,
        FeedbackModal,
        Task,
        Badge
    },
    setup(props, context) {

        const showModal = ref(false)

        const storeFeedback = feedbackStore()

        const { feedbacks, feedbackSelect } = storeToRefs(storeFeedback)
        const { resetFeedbackSelectData } = storeFeedback

        const deleteFeedback = () => {
        }

        const openFeedback = (feedback_id) => {
            feedbackSelect.value = feedback_id
            showModal.value = true
        }

        function closeModal() {
            resetFeedbackSelectData()
            showModal.value = false
        }

        async function onDragChange(event) {
            if (event.added) {
                let movedFeedback = event.added.element
                const columnIndex = _.findIndex(feedbacks.value, (col) =>
                    _.some(col.feedbacks, { _id: movedFeedback._id })
                )

                const targetColumn = feedbacks.value[columnIndex]
                let newStatus = targetColumn.status._id
                await updateFeedback(movedFeedback._id, { status: newStatus }, false)
            }
        }

        return {
            closeModal, openFeedback, feedbacks, onDragChange, deleteFeedback, showModal, feedbackSelect
        }
    }
}

</script>
