<template>
    <div class="relative bg-blue-50 border border-blue-200 rounded-md p-4 shadow-sm hover:shadow-md transition cursor-grab"
        @click="openFeedback(props.feedback._id)">
        <!-- Toolbar -->
         
        <div class="absolute top-2 right-2">
            <button @click="toggleMenu" class="text-blue-600 hover:text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 6v.01M12 12v.01M12 18v.01" />
                </svg>
            </button>

            <!-- Menu contextuel -->
            <div v-if="menuOpen"
                class="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-md z-10">
                <button @click="deleteCard"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Supprimer
                </button>
            </div>
        </div>

        <!-- Titre -->
        <h3 class="font-medium text-blue-800 mb-2">{{ props.feedback.title }}</h3>

        <!-- Badges -->
        <div class="flex flex-wrap gap-2 mb-3">
            <span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{{ props.feedback.type.libelle
                }}</span>
            <span v-if="props.feedback?.priority" class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{{ props.feedback?.priority?.libelle
                }}</span>
            <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                v-if="props.feedback.assignTo">Assigné à:
                {{ props.feedback.assignTo.lastname + ' ' + props.feedback.assignTo.firstname }}</span>
        </div>

        <!-- Infos -->
        <!-- <p class="text-sm text-blue-600"></p> -->

        <!-- Date -->
        <p class="text-xs text-gray-500 mt-3">{{ formatTimestampToDate( props.feedback.createdAt) }}</p>
    </div>
</template>

<script setup lang="ts">

onMounted(()=>{
})

import { formatTimestampToDate } from '@/utils/format'
import { onMounted, ref } from 'vue'

const props = defineProps({
    feedback: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['delete', 'openFeedback'])

const menuOpen = ref(false)

function toggleMenu() {
    menuOpen.value = !menuOpen.value
}

function deleteCard() {
    emit('delete')
    menuOpen.value = false
}

function openFeedback(feedback_id) {
    emit('openFeedback', feedback_id)
    menuOpen.value = false
}

</script>