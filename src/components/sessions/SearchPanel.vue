<template>
    <!-- One filter bar, in reading order: which project, which person, then
         the period. The two date fields used to sit alone with a button, and
         the project could not be chosen at all. -->
    <form class="rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:p-4" @submit.prevent="filter">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
            <div class="lg:col-span-3">
                <label for="session-project" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Projet
                </label>
                <select id="session-project" v-model="search_form.project_id" :class="fieldClass">
                    <option value="">Tous les projets</option>
                    <option v-for="project in projects" :key="project._id" :value="project._id">
                        {{ project.libelle }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-3">
                <label for="session-account" class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Personne
                </label>
                <select id="session-account" v-model="search_form.account" :class="fieldClass">
                    <option value="">Tout le monde</option>
                    <option v-for="person in visitors" :key="person._id" :value="person._id">
                        {{ personLabel(person) }}
                    </option>
                </select>
            </div>

            <div class="lg:col-span-2">
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Du</label>
                <flat-pickr v-model="search_form.start_date" :config="flatpickrConfig" :class="fieldClass"
                    placeholder="Date début" />
            </div>

            <div class="lg:col-span-2">
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Au</label>
                <flat-pickr v-model="search_form.end_date" :config="flatpickrConfig" :class="fieldClass"
                    placeholder="Date fin" />
            </div>

            <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
                <button type="submit"
                    class="h-11 flex-1 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition shadow-theme-xs hover:bg-brand-600">
                    Filtrer
                </button>
                <button v-if="isFiltered" type="button" @click="reset" title="Réinitialiser"
                    class="h-11 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    ✕
                </button>
            </div>
        </div>

        <p v-for="(message, field) in search_errors" :key="field" class="mt-2 text-xs text-error-500">
            {{ message }}
        </p>
    </form>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { sessionStore } from '@/stores/session/sessionStore'
import { projectStore } from '@/stores/project/projectStore'

const flatpickrConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'F j, Y',
    wrap: true,
}

const fieldClass =
    'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const store = sessionStore()
const { search_form, search_errors, visitors } = storeToRefs(store)
const { filterSessions, getVisitors, getSessions } = store

const { projects } = storeToRefs(projectStore())
const { getProjects } = projectStore()

onMounted(() => {
    if (!projects.value?.length) getProjects()
    getVisitors()
})

const personLabel = (person: any) => {
    const name = `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim()
    return name || person.email
}

const isFiltered = computed(() =>
    Boolean(
        search_form.value.project_id ||
        search_form.value.account ||
        search_form.value.start_date ||
        search_form.value.end_date,
    ),
)

const filter = async () => {
    await filterSessions({
        project_id: search_form.value.project_id,
        account: search_form.value.account,
        start_date: search_form.value.start_date,
        end_date: search_form.value.end_date,
    })
}

const reset = async () => {
    search_form.value.project_id = ''
    search_form.value.account = ''
    search_form.value.start_date = ''
    search_form.value.end_date = ''
    await getSessions()
}
</script>
