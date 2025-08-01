<template>
    <div class="grid grid-cols-14 gap-4">
        <div class="col-span-4">
            <select v-model="project" placeholder="Projets"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option value="" disabled>Projets</option>
                <option value="marketing" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    Marketing
                </option>
                <option value="template" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    Template
                </option>
                <option value="development" class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    Development
                </option>
            </select>
        </div>
        <div class="col-span-4">
            <input type="text" v-model="search" placeholder="Rechercher"
                class="dark:bg-dark-900 h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
        </div>
        <div class="relative col-span-4">
            <flat-pickr v-model="date_debut" :config="flatpickrConfig"
                class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Date début" />
        </div>
        <div class="relative col-span-4">
            <flat-pickr v-model="date_fin" :config="flatpickrConfig"
                class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Date fin" />
        </div>
        <div class="col-span-2 ms-2">
            <button type="button"
                class="px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                Filtrer
            </button>
        </div>
    </div>

</template>


<script setup lang="ts">

import { ref } from 'vue';

const date_debut = ref("")
const date_fin = ref("")
const project = ref("")
const flatpickrConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'F j, Y',
    wrap: true,
}
const search = ref("")
</script>
