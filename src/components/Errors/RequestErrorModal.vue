<template>
    <!-- Modal -->
    <Modal v-if="request !== null">
        <template #body>
            <div
                class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <h5 class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                    Détail Requête
                </h5>
                <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
                    <div class="space-y-2 text-sm">
                        <p><strong>URL:</strong> {{ request.general.url }}</p>
                        <p><strong>Méthode:</strong> {{ request.general.method }}</p>
                        <p><strong>Durée:</strong> {{ request.response.duration }}</p>
                        <p>
                            <strong>Status:</strong> {{ request.response.status }} -
                            {{ request.response.statusText }}
                        </p>
                        <div>
                            <p class="mb-1"><strong>Body:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.general.body }}</pre>
                        </div>

                        <div>
                            <p class="mb-1"><strong>Headers:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.general.headers }}</pre>
                        </div>
                        <div>
                            <p class="mb-1"><strong>Réponse:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.response.response }}</pre>
                        </div>

                    </div>

                    <div class="mt-6 text-right">
                        <button @click="$emit('close')" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Modal from '../profile/Modal.vue';
const props = defineProps({
    request: {
        type: Object || null,
        required: true
    }
})
const emits = defineEmits(['close'])

const request = computed(() => {
    if (props.request !== null && props.request !== undefined && props.request) {
        return props.request
    }
    return null
})
</script>