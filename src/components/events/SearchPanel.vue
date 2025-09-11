<template>
    <div class="grid grid-cols-14 gap-4">
        <div class="col-span-4">
            <select v-model="search_form.eventtype" placeholder="Projets"
                class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                <option value="">Type d'événements</option>
                <option v-for="(eventtype, index) in eventtypes" :key="index" :value="eventtype._id"
                    class="text-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    {{ eventtype.libelle }}
                </option>
            </select>
            <p v-if="search_errors.eventtype" style="color: red">{{ search_errors.eventtype }}</p>
        </div>
        <!-- <div class="col-span-4">
            <input type="text" v-model="search_form.search" placeholder="Rechercher"
                class="dark:bg-dark-900 h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
            <p v-if="search_errors.search" style="color: red">{{ search_errors.search }}</p>
        </div> -->
        <div class="relative col-span-4">
            <flat-pickr v-model="search_form.start_date" :config="flatpickrConfig"
                class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Date début" />
            <p v-if="search_errors.start_date" style="color: red">{{ search_errors.start_date }}</p>

        </div>
        <div class="relative col-span-4">
            <flat-pickr v-model="search_form.end_date" :config="flatpickrConfig"
                class="dark:bg-dark-900 h-11 appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                placeholder="Date fin" />
            <p v-if="search_errors.end_date" style="color: red">{{ search_errors.end_date }}</p>
        </div>
        <div class="col-span-2 ms-2">
            <button type="button" @click="filter"
                class="px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                Filtrer
            </button>
        </div>
    </div>

</template>


<script setup lang="ts">

import { eventStore } from '@/stores/event/eventStore.ts';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const flatpickrConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'F j, Y',
    wrap: true,
}

const store = eventStore()
const {
    search_form, search_errors, eventtypes } = storeToRefs(store)
const { filterEvents, getEventTypes } = store

onMounted(() => {
    getEventTypes()
})
const filter = async () => {
    await filterEvents()
}
</script>
