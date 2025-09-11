<template>
    <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition cursor-pointer"
        @click="openFrame">
        <!-- Icône + nom -->
        <div class="mb-2">
            <div style="word-break: break-all;">
                <span class="text-sm font-medium text-gray-800">{{ props.file.name }}</span>
                <div> <span class="text-xs text-gray-500">Type : {{ props.file.type }}</span>
                </div>
            </div>
        </div>
        <p class="text-xs text-gray-500 mb-3">Ajouté le {{ formatTimestampToDate(props.file.createdAt) }}</p>
    </div>
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
const previewAcceptedType = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mov",
    "video/avi",
    "video/mkv"
]

const printFile = async () => {
    await downloadFile(props.file.key, props.file.name)
}

const openFrame = () => {
    if (props.file && props.file !== undefined) {
        if (previewAcceptedType.includes(props.file.type)) {
            showModal.value = true
        }
        else {
            printFile()
        }
    }
}
</script>