<template>
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
                <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="px-5 py-3 text-left w-3/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nom du projet</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Statut</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Lien</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Script</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Date création</p>
                        </th>
                        <th class="px-5 py-3 text-left w-2/11 sm:px-6">
                            <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Action</p>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="(project, index) in projects" :key="index"
                        class="border-t border-gray-100 dark:border-gray-800">
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ project.libelle }}</p>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <span :class="[
                                'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                                {
                                    'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                                        project.active === true,
                                    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500':
                                        project.active === false,
                                },
                            ]">
                                {{ project.active === true ? "Actif" : 'Inactif' }}
                            </span>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ project.link }}</p>
                        </td>
                        <td>
                            <Button @click="copyScript(project.tracking_code, index)" size="sm" variant="outline"
                                :startIcon="TaskIcon">
                                <div :id="'copy-' + index"></div>
                            </Button>
                        </td>
                        <td class="px-5 py-4 sm:px-6">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{
                                moment(project.createdAt).format('DD-MM-YYYY HH:mm:ss') }}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Button from '../ui/Button.vue';
import TaskIcon from '@/icons/TaskIcon.vue';

const copyScript = (data, index) => {
    navigator.clipboard.writeText(data)
    const child = document.createElement("span")
    child.textContent = "Copié !"
    const button = document.getElementById('copy-' + index)
    button.appendChild(child)
    setTimeout(() => {
        button.removeChild(child)
    }, 1000)
}

import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
import moment from 'moment';
const store = projectStore()
const {
    projects } = storeToRefs(store)

const { getProjects } = store

onMounted(async () => {
    await handleProjects()
})

const handleProjects = async () => {
    try {
        await getProjects()
    } catch (err) {
    }
}
</script>

<style scoped>
</style>
