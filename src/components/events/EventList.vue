<template>
    <!-- The whole row opens the detail, and the type is coloured by severity:
         the eye button in a last column was a smaller target than the row, and
         every type was shown in the same red badge. -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th v-for="column in columns" :key="column.label"
                            :class="['px-5 py-3 text-left sm:px-6', column.hide]">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">{{ column.label }}</p>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr v-for="(event, index) in events" :key="event._id ?? index" @click="openModal(index)"
                        class="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        title="Voir le détail">
                        <td class="px-5 py-4 sm:px-6">
                            <span class="rounded-full px-2 py-0.5 text-xs font-medium"
                                :class="eventTone(event.type?.libelle)">
                                {{ eventLabel(event.type?.libelle) }}
                            </span>
                            <p v-if="summary(event)" class="mt-1 max-w-[280px] truncate text-xs text-gray-500 dark:text-gray-400"
                                :title="summary(event)">
                                {{ summary(event) }}
                            </p>
                        </td>

                        <td class="hidden px-5 py-4 sm:px-6 md:table-cell">
                            <p class="truncate text-sm text-gray-700 dark:text-gray-300">{{ event.project?.libelle }}</p>
                        </td>

                        <td class="hidden px-5 py-4 sm:px-6 xl:table-cell">
                            <button v-if="event.session" type="button"
                                class="text-sm font-medium text-brand-500 hover:underline"
                                @click.stop="openSessionDetail(event.session._id, event.project._id)">
                                {{ event.session.uniqueId }}
                            </button>
                            <span v-else class="text-sm text-gray-400">—</span>
                        </td>

                        <td class="hidden max-w-[240px] px-5 py-4 sm:px-6 lg:table-cell">
                            <p class="truncate text-sm text-gray-600 dark:text-gray-400" :title="event.page_url">
                                {{ event.page_url }}
                            </p>
                        </td>

                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-sm text-gray-700 dark:text-gray-300">{{ day(event.timestamp) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ hour(event.timestamp) }}</p>
                        </td>

                        <td class="px-5 py-4 text-right sm:px-6">
                            <span class="text-xs font-medium text-brand-500">Détail →</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <RequestErrorModal :request="currentRequest" @close="resetSelectError" />
    </div>
</template>

<script setup lang="ts">
import { eventStore } from "@/stores/event/eventStore.js";
import { storeToRefs } from "pinia";
import { eventLabel, eventTone } from '@/utils/eventLabels'
import moment from 'moment';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import RequestErrorModal from "../Errors/RequestErrorModal.vue";
const store = eventStore()
const {
    events } = storeToRefs(store)



const columns = [
    { label: 'Événement', hide: '' },
    { label: 'Projet', hide: 'hidden md:table-cell' },
    { label: 'Session', hide: 'hidden xl:table-cell' },
    { label: 'Page', hide: 'hidden lg:table-cell' },
    { label: 'Date', hide: '' },
    { label: '', hide: '' },
]

const day = (timestamp: number) => (timestamp ? moment(timestamp).format('DD/MM/YYYY') : '—')
const hour = (timestamp: number) => (timestamp ? moment(timestamp).format('HH:mm:ss') : '')

// One line that says what happened, taken from whichever field the type fills.
const summary = (event: any) => {
    const data = event.data ?? {}
    return (
        data.message ||
        data.label ||
        data.target ||
        data.name ||
        (data.general?.url ? `${data.general?.method ?? ''} ${data.general.url}`.trim() : '')
    )
}

const router = useRouter()
// Loading is owned by the page: a list mounted under `v-if="loading"` that
// fetched on mount unmounted itself, remounted and fetched again, forever.

const openSessionDetail = (session:any, project:any) => {
    router.push({ path: '/session/detail', query: { project: project, session: session } })
}

const selectedRequest = ref(null)

const openModal = (index:any) => {
    selectedRequest.value = index
}

const currentRequest = computed(() => {
    if (selectedRequest.value !== null) {
        return events.value[selectedRequest.value]
    }
    return null
})


const resetSelectError = () => {
    selectedRequest.value = null
}


</script>
