<template>
    <Modal v-if="isOpen"  @close="closeModal = false">
        <template #body>
            <div
                class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div class="px-2 pr-14">
                    <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Modifier
                    </h4>
                </div>
                <form class="flex flex-col">
                    <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
                        <div class="mt-7">

                            <div class="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div class="col-span-2 lg:col-span-1">
                                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Prénom
                                    </label>
                                    <input type="text" value="Musharof"
                                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                </div>

                                <div class="col-span-2 lg:col-span-1">
                                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Nom
                                    </label>
                                    <input type="text" value="Chowdhury"
                                        class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                </div>

                                <div class="col-span-2 lg:col-span-1">
                                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Téléphone
                                    </label>
                                    <input type="text" value="+09 363 398 46"
                                        class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <button @click="closeModal" type="button"
                            class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">
                            Fermer
                        </button>
                        <button @click="saveProfile" type="button"
                            class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto">
                            Enregistrer
                        </button>
                    </div>
                </form>

                </div>
        </template>
    </Modal>
</template>
<script setup>
import { onMounted, ref, watchEffect } from 'vue'
import Modal from './Modal.vue'
const isOpen = ref(false)
const props = defineProps({
    open: {
        type: Boolean,
        required: true
    }
})

const emits = defineEmits(['close'])

onMounted(() => {

})

watchEffect(() => {
    if (props.open && props.open !== undefined) {
        isOpen.value = props.open
    }
})

const closeModal = () => {
    isOpen.value = false
    emits('close')
    resetModalFields()
}

const resetModalFields = () => {
    libelle.value = ''
    link.value = ''
}

const saveProfile = () => {
    // Implement save profile logic here
}
</script>