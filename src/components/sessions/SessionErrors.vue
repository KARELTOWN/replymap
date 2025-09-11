<template>

    <h2 class="text-xl font-bold my-4">Erreurs</h2>
    <em>(Erreurs JS, Erreurs de requêtes)</em>
    <loadingStatus :loading="loading" :error-message="errorMessage" />
    <div v-if="session_errors.length > 0" class="mt-6">
        <!-- <div class="grid grid-cols-10 my-2">
            <div class="relative z-20 bg-transparent">
                <select v-model="session_errors_limit" @change="fetchErrors"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                    <option value="10" selected> 10</option>
                    <option value="30" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        30
                    </option>
                    <option value="50" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        50
                    </option>
                    <option value="100" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        100
                    </option>
                    <option value="1000" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                        Tout
                    </option>
                </select>
            </div>
        </div> -->
        <div class="overflow-x-auto rounded-lg border-gray-300">
            <table class="table-auto table-border text-sm text-left text-gray-800 w-full">
                <thead class="bg-gray-100 border">
                    <tr>
                        <th class="px-4 py-2">Type</th>
                        <th class="px-4 py-2 text-center">Date</th>
                        <th class="px-4 py-2">Page URL</th>
                        <th class="px-4 py-2 text-center">Status</th>
                        <th class="px-4 py-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(req, index) in session_errors" :key="req._id" class="border hover:bg-gray-50">
                        <td class="px-4 py-2 text-center">
                            <Badge color="error">{{ req.type.libelle }}</Badge>
                        </td>
                        <td class="px-4 py-2 text-center">
                            <Badge color="light" @click="goToEvent(req.timestamp)"> {{
                                formatTimestampToDate(req.timestamp) }} </Badge>
                        </td>
                        <td class="px-4 py-2 text-center max-w-[250px] truncate" :title="req.page_url">{{ req.page_url
                            }}</td>
                        <td class="px-4 py-2 text-center">{{ req.data?.response?.status }}</td>
                        <td class="px-4 py-2 text-center">
                            <button type="button" @click="openModal(index)"
                                class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
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

        <div class="grid grid-cols-2 mt-5">
            <div>
                <Pagination :paginator="session_errors" :current_page="page" :totalPages="totalPages"
                    @page-change="fetchNext" />
            </div>
            <div>
                <strong>Total : </strong> {{ total }}
            </div>

        </div>

    </div>

    <RequestErrorModal :request="currentRequest" @close="resetSelectError" />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import RequestErrorModal from '@/components/Errors/RequestErrorModal.vue';
import { useRoute } from 'vue-router';
import loadingStatus from '../loading/loadingStatus.vue';
import Badge from '../ui/Badge.vue';
import Pagination from '../pagination/Pagination.vue';
import { formatTimestampToDate } from '@/utils/format';
const store = sessionStore()
const { session_errors, page, totalPages, total, player, session } = storeToRefs(store)
const { showErrors } = store
const route = useRoute()

const session_id = ref('')
const project_id = ref('')

const loading = ref(false)
const errorMessage = ref('')

const selectedRequest = ref(null)

const openModal = (index) => {
    selectedRequest.value = index
}

const currentRequest = computed(() => {
    if (selectedRequest.value !== null) {
        return session_errors.value[selectedRequest.value]
    }
    return null
})

const resetSelectError = () => {
    selectedRequest.value = null
}

onMounted(async () => {
    session_id.value = route.query.session
    project_id.value = route.query.project
    errorMessage.value = ''
    if (!session_id.value || !project_id.value) {
        errorMessage.value = "Impossible de charger les erreurs"
        return
    }
    fetchErrors()
})


const fetchErrors = async () => {
    loading.value = true
    try {
        await showErrors({ session: session_id.value, project: project_id.value })
        loading.value = false
        if (Array.isArray(session_errors.value) && session_errors.value.length == 0) {
            errorMessage.value = 'Aucune donnée à charger'
        }
        else {
            errorMessage.value = ''
        }
    }
    catch (error) {
        errorMessage.value = "Erreur lors du chargement des données"
        loading.value = false
    }
}

const fetchNext = async (nextpage) => {
    page.value = nextpage
    await showErrors({ session: session_id.value, project: project_id.value })
}

const formatSessionDate = computed(() => {
    if (session.value) {
        console.log('startat', session.value.startedAt)

        return new Date(session.value.startedAt).getTime();
    }
    return null
})

const goToEvent = (timestamp) => {
    if (player.value) {
        if (formatSessionDate.value) {
            const relativeTime = timestamp - formatSessionDate.value
            // 2. Vérifier bornes pour éviter d'aller hors replay
            if (relativeTime < 0) { relativeTime = 0 };
            player.value.goto(relativeTime)
        }
    }
}


</script>
