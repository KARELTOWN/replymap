<template>
    <!-- Modal -->
    <Modal v-if="request !== null">
        <template #body>
            <div
                class="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <h5 class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                    Détail
                </h5>
                <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
                    <div class="space-y-2 text-sm">
                        <p v-if="request.data?.response?.status">
                            <strong>Date:</strong> {{ formatTimestampToDate(request.timestamp) }}
                        </p>
                        <p><strong>Page URL:</strong> {{
                            request.page_url }}</p>
                        <p v-if="request.data?.general?.url"><strong>URL Requête:</strong> {{ request.data?.general?.url
                        }}</p>
                        <p v-if="request.data?.general?.method"><strong>Méthode:</strong> {{
                            request.data?.general?.method
                            }}</p>
                        <p v-if="request.data?.response?.duration"><strong>Durée:</strong> {{
                            request.data?.response?.duration }}</p>
                        <p v-if="request.data?.response?.status">
                            <strong>Status:</strong> {{ request.data?.response?.status }} -
                            {{ request.data?.response?.statusText }}
                        </p>
                        <div v-if="request.data?.general?.body">
                            <p class="mb-1"><strong>Body:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.data?.general?.body }}</pre>
                        </div>
                        <div v-if="request.data && request.type.libelle !== 'request_errors'">
                            <p class="mb-1"><strong>Données</strong></p>
                            <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.data }}</pre>
                        </div>

                        <div v-if="request.data?.general?.headers">
                            <p class="mb-1"><strong>Headers:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.data?.general?.headers }}</pre>
                        </div>
                        <div v-if="request.data?.response?.response">
                            <p class="mb-1"><strong>Réponse:</strong></p>
                            <pre
                                class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ request.data?.response?.response }}</pre>
                        </div>

                    </div>

                    <div class="mt-4" v-if="request?.type?.libelle === 'web_vitals'">
                        <Button variant="outline" class="mb-4" @click="metrics = !metrics">Comprendre ces métriques</Button>
                        <PerformanceMetrics v-if="metrics === true" :data="request.data" />
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
import { computed, ref } from 'vue';
import Modal from '../profile/Modal.vue';

import { formatTimestampToDate } from '@/utils/format';
import Button from '../ui/Button.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
const props = defineProps({
    request: {
        type: Object || null,
        required: true
    }
})
const emits = defineEmits(['close'])
let metrics = ref(false)
const request = computed(() => {
    if (props.request !== null && props.request !== undefined && props.request) {
        return props.request
    }
    return null
})
</script>