<template>
    <div class="grid grid-cols-2 gap-2">
        <div class="col-span-1" v-for="file in feedbackSelect_files">
            <FileDisplay :file="file" />
        </div>
    </div>
</template>

<script setup>
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { storeToRefs } from 'pinia';
const storeFeedback = feedbackStore()
import FileDisplay from '@/components/Element/FileDisplay.vue';
const { feedbackSelect_files } = storeToRefs(storeFeedback)
</script>