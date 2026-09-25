<template>
    <!-- A reading list, not a spreadsheet. The table carried five columns on a
         narrow card, so it scrolled sideways and the date took more room than
         what had actually happened. Each line now says what it was, where, and
         at which moment of the replay it can be reviewed. -->
    <div class="mb-4 flex items-start justify-between gap-3">
        <div>
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Événements de la session</h4>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Cliquez sur "Revoir" voir le moment exact dans l'enregistrement.
            </p>
        </div>
        <span v-if="total"
            class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
            {{ total }}
        </span>
    </div>

    <loadingStatus :loading="loading" :error-message="errorMessage" />

    <ul v-if="session_errors.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
        <li v-for="(req, index) in session_errors" :key="req._id">
            <div class="group flex items-start gap-3 py-3">
                <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="dotFor(req.type?.libelle)"></span>

                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="eventTone(req.type?.libelle)">
                            {{ eventLabel(req.type?.libelle) }}
                        </span>
                        <span v-if="req.data?.response?.status"
                            class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                            HTTP {{ req.data.response.status }}
                        </span>
                        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {{ offsetLabel(req.timestamp) }}
                        </span>
                    </div>

                    <p v-if="summary(req)" class="mt-1 break-words text-sm text-gray-700 dark:text-gray-300">
                        {{ summary(req) }}
                    </p>
                    <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" :title="req.page_url">
                        {{ req.page_url }}
                    </p>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <button type="button" @click="goToEvent(req.timestamp)"
                        class="rounded-lg px-2 py-1 text-xs font-medium text-brand-500 transition hover:bg-brand-50 dark:hover:bg-brand-500/10">
                        Revoir
                    </button>
                    <button type="button" @click="openModal(index)"
                        class="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]">
                        Détail
                    </button>
                </div>
            </div>
        </li>
    </ul>

    <div v-if="totalPages > 1" class="mt-4 flex justify-center border-t border-gray-100 pt-4 dark:border-gray-800">
        <Pagination :paginator="session_errors" :current_page="page" :totalPages="totalPages"
            @page-change="fetchNext" />
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
import Pagination from '../pagination/Pagination.vue';
import { eventLabel, eventTone } from '@/utils/eventLabels'
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

// Where the event sits in the replay, which is what a reader looks for here:
// the wall-clock date said nothing about the recording.
const offsetLabel = (timestamp) => {
    const start = formatSessionDate.value
    if (!start) return ''
    const seconds = Math.max(0, Math.floor((timestamp - start) / 1000))
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

const dotFor = (type) =>
    ({
        runtime_errors: 'bg-error-500',
        unhandle_promise_rejection: 'bg-error-500',
        request_errors: 'bg-orange-400',
        performance_issues: 'bg-blue-light-500',
        form_error: 'bg-orange-400',
        form_submit: 'bg-blue-light-500',
        page_view: 'bg-gray-400',
    })[type] ?? 'bg-gray-400'

// One line that says what happened, taken from whichever field the type fills.
const summary = (req) => {
    const data = req.data ?? {}
    return (
        data.message ||
        data.label ||
        data.target ||
        data.name ||
        (data.general?.url ? `${data.general?.method ?? ''} ${data.general.url}`.trim() : '')
    )
}

const goToEvent = (timestamp) => {
    if (player.value) {
        if (formatSessionDate.value) {
            let relativeTime = timestamp - formatSessionDate.value
            // 2. Check bounds so the replay is never overrun
            if (relativeTime < 0) { relativeTime = 0 };
            player.value.goto(relativeTime)
        }
    }
}


</script>
