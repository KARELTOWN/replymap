<template>
  <!-- Preview of one file: the image, the video or the document itself,
       rather than an <embed> squeezed into a 500px box that showed nothing for
       images and videos. -->
  <Modal v-if="props.open === true">
    <template #body>
      <div
        class="relative mx-3 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900 sm:mx-6"
      >
        <header class="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <p class="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-white/90" :title="fileName">
            {{ fileName }}
          </p>
          <div class="flex shrink-0 items-center gap-3">
            <button type="button" class="text-sm font-medium text-brand-500 hover:text-brand-600" @click="printFile">
              Télécharger
            </button>
            <button
              type="button"
              class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              aria-label="Fermer"
              @click="$emit('close')"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div class="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-50 p-3 dark:bg-gray-950">
          <img v-if="kind === 'image'" :src="props.file.key" :alt="fileName" class="max-h-[75vh] max-w-full object-contain" />
          <video v-else-if="kind === 'video'" :src="props.file.key" controls class="max-h-[75vh] w-full" />
          <iframe v-else-if="kind === 'pdf'" :src="props.file.key" :title="fileName" class="h-[75vh] w-full border-0" />
          <p v-else class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Ce type de fichier ne peut pas être affiché ici. Téléchargez-le pour l'ouvrir.
          </p>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from '../profile/Modal.vue'
import { fileStore } from '@/stores/file/fileStore'

const props = defineProps({
  file: Object,
  open: Boolean,
})
defineEmits(['close'])

const store = fileStore()
const { downloadFile } = store

const fileName = computed(() => props.file?.name ?? 'Fichier')

const kind = computed(() => {
  const type = props.file?.type ?? ''
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type === 'application/pdf') return 'pdf'
  return 'other'
})

const printFile = async () => {
  await downloadFile(props.file.key, props.file.name)
}
</script>
