<template>
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="px-5 py-3 text-left w-3/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Type</p>
                        </th>
                        <th class="px-5 py-3 text-left w-3/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Projet</p>
                        </th>
                        <th class="px-5 py-3 text-left w-3/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Session</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Page URL</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Date</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Action</p>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="(event, index) in events" :key="index"
                        class="border-t border-gray-100 dark:border-gray-800">
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm text-sm/6 dark:text-gray-400">
                                <Badge color="error">
                                    {{ event.type.libelle }}
                                </Badge>

                            </p>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                                {{ event.project.libelle }}
                            </p>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400" v-if="event.session">
                                <button type="button" class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                    @click="openSessionDetail(event.session._id, event.project._id)">
                                    <!-- <svg class="fill-gray-400 dark:fill-gray-300" width="30" height="30"
                                        viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" />
                                    </svg> -->
                                    {{ event.session._id }}
                                </button>
                            </p>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                                {{ event.page_url }}
                            </p>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ format(event.timestamp) }}</p>
                        </td>
                        <td>
                            <button type="button" class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                @click="openModal(index)">
                                <svg class="fill-gray-400 dark:fill-gray-300" width="30" height="30" viewBox="0 0 20 20"
                                    fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <Modal v-if="currentRequest !== null">
            <template #body>
                <div
                    class="no-scrollbar relative w-full max-h-[500px] max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <h5
                        class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        Détail Erreur
                    </h5>
                    <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
                        <div class="space-y-2 text-sm">
                            <p><strong>URL:</strong> {{ currentRequest.page_url }}</p>
                            <div>
                                <p class="mb-1"><strong>Erreur</strong></p>
                                <pre
                                    class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ currentRequest.data }}</pre>
                            </div>

                        </div>

                        <div class="mt-6 text-right">
                            <button @click="selectedRequest = null"
                                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </Modal>

    </div>

</template>

<script setup lang="ts">
import { eventStore } from "@/stores/event/eventStore.js";
import { storeToRefs } from "pinia";
import moment from 'moment';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Badge from '../ui/Badge.vue';
import Modal from "../profile/Modal.vue";
const store = eventStore()
const {
    events } = storeToRefs(store)

const { getEvents } = store

const format = (data) => {
    if (data) {
        return moment(data).format('DD-MM-YYYY HH:mm:ss')
    }
    return ''
}

const router = useRouter()
onMounted(async () => {
    await handleEvents()
})

const handleEvents = async () => {
    try {
        await getEvents()
    } catch (err) {
        console.log('Erreur ', err)
    }
}

const openSessionDetail = (session, project) => {
    router.push({ path: '/session/detail', query: { project: project, session: session } })
}

const selectedRequest = ref(null)

const openModal = (index) => {
    selectedRequest.value = index
}

const currentRequest = computed(() => {
    if (selectedRequest.value !== null) {
        return events.value[selectedRequest.value]
    }
    return null
})

</script>
