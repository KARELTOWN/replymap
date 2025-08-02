<template>
  <Modal v-if="isOpen">
    <template #body>
      <div
        class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <h5 class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
          {{ selectProject ? 'Modifier le Projet' : 'Ajouter un Projet' }}
        </h5>
        <form class="flex flex-col" @submit.prevent="handleSubmit">
          <div class="mt-8">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Nom du Projet
              </label>
              <input v-model="libelle" type="text"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
              <p v-if="errors.libelle" style="color: red">{{ errors.libelle }}</p>

            </div>

            <div class="mt-6">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"> Lien </label>
                <div class="relative">
                  <span
                    class="absolute left-0 top-1/2 inline-flex h-11 -translate-y-1/2 items-center justify-center border-r border-gray-200 py-3 pl-3.5 pr-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    URL
                  </span>
                  <input v-model="link" type="url" placeholder="Exemple : https://replaymap.com"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-[90px] text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                  <p v-if="errors.link" style="color: red">{{ errors.link }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6" v-if="tracking_code">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"> Script </label>
                <em>Intégrer ce script dans le pied de page de votre site (FOOTER)</em>
                <div class="relative">
                  <button @click="copyScript(tracking_code)" type="button"
                    class="absolute right-0 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-1 border-l border-gray-200 py-3 pl-3.5 pr-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-400">
                    <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M6.58822 4.58398C6.58822 4.30784 6.81207 4.08398 7.08822 4.08398H15.4154C15.6915 4.08398 15.9154 4.30784 15.9154 4.58398L15.9154 12.9128C15.9154 13.189 15.6916 13.4128 15.4154 13.4128H7.08821C6.81207 13.4128 6.58822 13.189 6.58822 12.9128V4.58398ZM7.08822 2.58398C5.98365 2.58398 5.08822 3.47942 5.08822 4.58398V5.09416H4.58496C3.48039 5.09416 2.58496 5.98959 2.58496 7.09416V15.4161C2.58496 16.5207 3.48039 17.4161 4.58496 17.4161H12.9069C14.0115 17.4161 14.9069 16.5207 14.9069 15.4161L14.9069 14.9128H15.4154C16.52 14.9128 17.4154 14.0174 17.4154 12.9128L17.4154 4.58398C17.4154 3.47941 16.52 2.58398 15.4154 2.58398H7.08822ZM13.4069 14.9128H7.08821C5.98364 14.9128 5.08822 14.0174 5.08822 12.9128V6.59416H4.58496C4.30882 6.59416 4.08496 6.81801 4.08496 7.09416V15.4161C4.08496 15.6922 4.30882 15.9161 4.58496 15.9161H12.9069C13.183 15.9161 13.4069 15.6922 13.4069 15.4161L13.4069 14.9128Z"
                        fill="" />
                    </svg>
                    <div>{{ copyText }}</div>
                  </button>
                  <input v-model="tracking_code" type="text"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-[90px] text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                </div>
              </div>
            </div>

          </div>

          <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
            <button @click="closeModal"
              class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">
              Fermer
            </button>

            <button type="submit" :disabled="disableBtn"
              class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto">
              {{ selectProject ? 'Modifier' : 'Ajouter' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup>

import { ref, reactive, onMounted, watchEffect } from 'vue'
import Modal from '@/components/profile/Modal.vue'

import { projectStore } from "@/stores/project/projectStore";
import { storeToRefs } from "pinia";
const store = projectStore()
const { errors,
  projectSuccess,
  tracking_code } = storeToRefs(store)
const { createProject } = store
const isOpen = ref(false)
const libelle = ref('')
const link = ref('')
const selectProject = ref(false)
const props = defineProps({
  open: {
    type: String,
    required: true
  }
})

const emits = defineEmits(['close'])

onMounted(() => {
  errors.value = {}
  tracking_code.value = ''
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

const disableBtn = ref(false)

const handleSubmit = async () => {
  try {
    disableBtn.value = true
    await createProject({
      libelle: libelle.value,
      link: link.value
    })
    disableBtn.value = false

    if (projectSuccess.value === true) {
      libelle.value = ''
      link.value = ''
    }

  } catch (err) {
    disableBtn.value = false
    console.log('Erreur ', err)
  }
}
const copyText = ref('')

const copyScript = (data) => {
  navigator.clipboard.writeText(data)
  copyText.value = 'Copier!'
  setTimeout(() => {
    copyText.value = ''
  }, 1000)
}

</script>
