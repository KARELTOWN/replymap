<template>
    <!-- Project, author and period are read by the API; type and status narrow
         what came back. The bar used to offer only the first three, so a board
         could not be limited to one person or one week. -->
    <form class="w-full rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:p-4"
        @submit.prevent="applyFilters">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
            <div class="lg:col-span-3">
                <label for="feedback-project" :class="labelClass">Projet</label>
                <select id="feedback-project" v-model="project_id" @change="changeProject" :class="fieldClass">
                    <option v-for="project in projects" :key="project._id" :value="project._id">
                        {{ project.libelle }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-2">
                <label for="feedback-author" :class="labelClass">Auteur</label>
                <select id="feedback-author" v-model="search_form.author" :class="fieldClass">
                    <option value="">Tout le monde</option>
                    <option v-for="person in authors" :key="person._id" :value="person._id">
                        {{ personLabel(person) }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-2">
                <label for="type-filter" :class="labelClass">Type</label>
                <select id="type-filter" v-model="search_form.type" :class="fieldClass">
                    <option value="">Tous les types</option>
                    <option v-for="feedbackType in feedbackTypes" :key="feedbackType._id" :value="feedbackType._id">
                        {{ feedbackType.libelle }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-2">
                <label for="status-filter" :class="labelClass">Statut</label>
                <select id="status-filter" v-model="search_form.status" :class="fieldClass">
                    <option value="">Tous les statuts</option>
                    <option v-for="status in feedbackStatus" :key="status._id" :value="status._id">
                        {{ status.libelle }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-3">
                <label :class="labelClass">Période</label>
                <div class="flex items-center gap-2">
                    <flat-pickr v-model="search_form.start_date" :config="flatpickrConfig" :class="fieldClass"
                        placeholder="Du" />
                    <flat-pickr v-model="search_form.end_date" :config="flatpickrConfig" :class="fieldClass"
                        placeholder="Au" />
                </div>
            </div>

            <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-12">
                <button type="submit"
                    class="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white transition shadow-theme-xs hover:bg-brand-600">
                    Filtrer
                </button>
                <button v-if="isFiltered" type="button" @click="reset"
                    class="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    Réinitialiser
                </button>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { projectStore } from '@/stores/project/projectStore.ts'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts'
import { authorOptionLabel } from '@/utils/authorLabel'

const flatpickrConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    wrap: true,
}

const labelClass = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400'
const fieldClass =
    'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const store = projectStore()
const storeFeedback = feedbackStore()

const { projects } = storeToRefs(store)
const { getProjects } = store

const { project_id, feedbackTypes, feedbackStatus, search_form, authors } = storeToRefs(storeFeedback)
const { feedbackParams, feedbackPerProject, getAuthors } = storeFeedback

// The project last looked at, so coming back to the board does not silently
// switch to another one.
const STORAGE_KEY = 'bugreveal_feedback_project'

// Picking the project only from a watcher missed the case where the store was
// already filled (coming from the Projects page): nothing was selected, and
// the board stayed empty with no explanation.
const selectProject = () => {
    const available = projects.value
    if (!Array.isArray(available) || available.length === 0) return
    if (project_id.value && available.some((project: any) => project._id === project_id.value)) return

    const remembered = localStorage.getItem(STORAGE_KEY)
    const chosen = available.find((project: any) => project._id === remembered) ?? available[0]
    project_id.value = chosen._id
    loadBoard()
}

watch(() => projects.value, selectProject)

onMounted(async () => {
    feedbackParams()
    await getProjects()
    selectProject()
})

const loadBoard = async () => {
    if (!project_id.value) return
    localStorage.setItem(STORAGE_KEY, project_id.value)
    await Promise.all([feedbackPerProject(), getAuthors()])
}

// Changing project resets the author, who belongs to the project just left.
const changeProject = async () => {
    search_form.value.author = ''
    await loadBoard()
}

const applyFilters = () => feedbackPerProject()

// A guest has no name to show, only the email they typed: the option says so
// rather than listing a bare address next to the members.
const personLabel = (person: any) => authorOptionLabel(person)

const isFiltered = computed(() =>
    Boolean(
        search_form.value.author ||
        search_form.value.type ||
        search_form.value.status ||
        search_form.value.start_date ||
        search_form.value.end_date,
    ),
)

const reset = async () => {
    search_form.value.author = ''
    search_form.value.type = ''
    search_form.value.status = ''
    search_form.value.start_date = ''
    search_form.value.end_date = ''
    await feedbackPerProject()
}
</script>
