<template>
    <div v-for="event in history" :key="event.id" class="border-b pb-2">
        <div><strong>{{ formatTimestampToDate(event.createdAt) }}</strong> — {{ event.description }}</div>
        <div class="text-xs text-gray-500" v-if="event.createdBy">Déclenché par
            {{ event.createdBy.firstname + ' ' + event.createdBy.lastname }}</div>
    </div>
</template>

<script setup>
import { feedbackHistoryStore } from '@/stores/feedback/feedbackHistory';
import { feedbackStore } from '@/stores/feedback/feedbackStore';
import { formatTimestampToDate } from '@/utils/format';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
const store = feedbackHistoryStore()
const feedStore = feedbackStore()
const { history } = storeToRefs(store)

const { reload } = storeToRefs(store)
const { feedbackSelect } = storeToRefs(feedStore)
const {
    feedbackHistory
} = store

onMounted(() => {
    feedbackHistory(feedbackSelect.value)
})

store.$subscribe(async (mutation, state) => {
    console.log('Mutation:', mutation);
    console.log('État après mutation:', state);
    if (state.reload === feedbackSelect.value) {
        await feedbackHistory(feedbackSelect.value)
        reload.value = null

    }
})

</script>