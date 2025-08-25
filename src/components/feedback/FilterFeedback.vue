<template>
    <div class="grid grid-cols-18 gap-4">
        <div class="col-span-4">
            <label for="projects"> Projets</label>
            <select id="projects" v-model="project_id" placeholder="Projets" @change="getFeedbacks"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option v-for="(project, index) in projects" :key="index" :value="project._id"
                    class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {{ project.libelle }}
                </option>
            </select>
        </div>

        <!-- <div class="col-span-4">
            <select v-model="search_form.type" placeholder="Types de feedbacks"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option value="" selected>Types</option>
                <option v-for="(feedbackType, index) in feedbackTypes" :key="index" :value="feedbackType._id"
                    class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {{ feedbackType.libelle }}
                </option>
            </select>
        </div> -->

        <!-- <div class="col-span-4">
            <select v-model="search_form.priority" placeholder="Priorités de feedbacks"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option value="" selected>Priorités</option>
                <option v-for="(priority, index) in feedbackPriority" :key="index" :value="priority._id"
                    class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {{ priority.libelle }}
                </option>
            </select>
        </div> -->

        <!-- <div class="col-span-4">
            <select v-model="search_form.status" placeholder="Status de feedbacks"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option value="" selected>Status</option>
                <option v-for="(status, index) in feedbackStatus" :key="index" :value="status._id"
                    class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {{ status.libelle }}
                </option>
            </select>
        </div> -->

        <!-- <div class="col-span-2 ms-2">
            <button type="button" @click="filter" disabled
                class="px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                Filtrer
            </button>
        </div> -->
    </div>

</template>


<script setup lang="ts">

import { projectStore } from '@/stores/project/projectStore.ts';
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';

import { storeToRefs } from 'pinia';
import { onMounted, watch } from 'vue';

const store = projectStore()
const storeFeedback = feedbackStore()

const {
    projects } = storeToRefs(store)

watch(
    () => projects.value,
    (newV) => {
        if (Array.isArray(newV) && newV.length > 0) {
            project_id.value = newV[0]._id
            getFeedbacks()
        }
    }
)
const { getProjects } = store

const { project_id, feedbackPriority, feedbackTypes, feedbackStatus, search_form, feedbacks } = storeToRefs(storeFeedback)
const { feedbackParams, feedbackPerProject } = storeFeedback

onMounted(() => {
    getProjects()
    feedbackParams()
})
const getFeedbacks = async () => {
    await feedbackPerProject()
}
</script>
