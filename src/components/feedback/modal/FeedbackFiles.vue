<template>
    <p v-if="!feedbackSelect_files || feedbackSelect_files.length === 0"
        class="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
        Aucun fichier joint à ce feedback.
    </p>
    <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <FileDisplay v-for="file in feedbackSelect_files" :key="file._id" :file="file" />
    </div>
</template>

<script setup>
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { storeToRefs } from 'pinia';
const storeFeedback = feedbackStore()
import FileDisplay from '@/components/Element/FileDisplay.vue';
const { feedbackSelect_files } = storeToRefs(storeFeedback)
</script>