<template>
    <!-- One card per project rather than a six-column table: a project is a
         name, an address, its script and the people on it. On a phone the same
         cards simply stack, instead of a table scrolling sideways. -->
    <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="(project, index) in projects" :key="project._id"
            class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <h3 class="truncate text-sm font-semibold text-gray-800 dark:text-white/90" :title="project.libelle">
                        {{ project.libelle }}
                    </h3>
                    <a :href="project.link" target="_blank" rel="noopener noreferrer"
                        class="mt-0.5 block truncate text-xs text-gray-500 hover:text-brand-500 hover:underline dark:text-gray-400"
                        :title="project.link">
                        {{ project.link }}
                    </a>
                </div>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" :class="project.active === true
                    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                    : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'">
                    {{ project.active === true ? 'Actif' : 'Inactif' }}
                </span>
            </div>

            <dl class="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div>
                    <dt class="inline">Créé le </dt>
                    <dd class="inline font-medium text-gray-700 dark:text-gray-300">
                        {{ moment(project.createdAt).format('DD/MM/YYYY') }}
                    </dd>
                </div>
                <div v-if="project.creator === true">
                    <dd class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                        Vous êtes propriétaire
                    </dd>
                </div>
            </dl>

            <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button type="button" @click="copyScript(project.tracking_code, index)"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    <TaskIcon class="h-4 w-4" />
                    {{ copiedIndex === index ? 'Copié !' : 'Script' }}
                </button>

                <button type="button" @click="openIntegrationModal(project._id)"
                    class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]">
                    Intégration
                </button>

                <div class="ml-auto flex items-center gap-1">
                    <button v-if="project.creator === true" type="button" @click="invite(project)" title="Membres"
                        class="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]">
                        <UserCircleIcon class="h-4 w-4" />
                    </button>
                    <button v-if="project.creator === true" type="button" @click="update(project)" title="Modifier"
                        class="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]">
                        <SettingsIcon class="h-4 w-4" />
                    </button>
                    <button v-if="project.creator === false" type="button" @click="quit(project)"
                        title="Quitter le projet"
                        class="rounded-lg p-2 text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10">
                        <LogoutIcon class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </li>
    </ul>
</template>

<script setup>
import { ref } from 'vue'
import TaskIcon from '@/icons/TaskIcon.vue';
import SettingsIcon from '@/icons/SettingsIcon.vue'
import LogoutIcon from '@/icons/LogoutIcon.vue';
import UserCircleIcon from '@/icons/UserCircleIcon.vue';
import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
import moment from 'moment';
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router';

const router = useRouter()

const openIntegrationModal = (project) => {
    router.push({ path: '/integration-configuration', query: { project } })
}

// The confirmation used to be a <span> appended to the button by hand, which
// left the DOM out of step with the list when a page changed underneath.
const copiedIndex = ref(null)

const copyScript = (data, index) => {
    navigator.clipboard.writeText(data)
    copiedIndex.value = index
    setTimeout(() => {
        if (copiedIndex.value === index) copiedIndex.value = null
    }, 1500)
}


const store = projectStore()
const {
    projects, selectProject, openModal, errors, openModalInvitation, projectSuccess } = storeToRefs(store)

const { getProjects, quitProject } = store

// Loading is owned by the page: a list mounted under `v-if="loading"` that
// fetched on mount unmounted itself, remounted and fetched again, forever.

const handleProjects = async () => {
    try {
        await getProjects()
    } catch (err) {
    }
}

const update = (project) => {
    errors.value = {}
    selectProject.value = project
    openModal.value = true
}

const invite = (project) => {
    selectProject.value = project
    openModalInvitation.value = true
}

const quit = async (project) => {
    Swal.fire({
        title: "Etes vous sûr de vouloir quitter ce projet?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, quiiter!"
    }).then(async (result) => {
        if (result.isConfirmed) {
            await quitProject({ project_id: project._id })
            if (projectSuccess.value === true) {
                handleProjects()
            }
        }
    });
}

</script>

<style scoped></style>
