<template>
    <button type="button"
        class="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
        @click="openFrame">
        <!-- Icon + name -->
        <div class="mb-2">
            <div style="word-break: break-all;">
                <span class="text-sm font-medium text-gray-800">{{ props.file.name }}</span>
                <div> <span class="text-xs text-gray-500">Type : {{ props.file.type }}</span>
                </div>
            </div>
        </div>
        <p class="text-xs text-gray-500 mb-3">Ajouté le {{ formatTimestampToDate(props.file.createdAt) }}</p>
    </button>
    <FileFrame :file="props.file" :open="showModal" @close="closeModal" />
</template>

<script setup>
import { formatTimestampToDate } from '@/utils/format';
import FileFrame from './FileFrame.vue';
import { fileStore } from '@/stores/file/fileStore';
const store = fileStore()
const { downloadFile } = store

import { ref } from 'vue';
const props = defineProps({
    file: Object
})
const showModal = ref(false)
const closeModal = () => {
    showModal.value = false
}
// Anything the browser renders on its own opens in the preview; the rest is
// downloaded. The list used to name a few types only, so a png screenshot
// opened while a webm recording was downloaded.
const canPreview = (type = "") =>
    type.startsWith("image/") || type.startsWith("video/") || type === "application/pdf" 

const printFile = async () => {
    await downloadFile(props.file.key, props.file.name)
}

const openFrame = () => {
    if (props.file && props.file !== undefined) {
        if (canPreview(props.file.type)) {
            showModal.value = true
        }
        else {
            printFile()
        }
    }
}
</script>