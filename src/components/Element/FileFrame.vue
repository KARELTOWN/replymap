<template>

    <Modal v-if="props.open === true">
        <template #body>
            <div
                class="no-scrollbar relative w-full overflow-y-auto max-h-[500px] mx-11 my-11 rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-5">
                <div>
                    <div class="flex">
                        <a href="#" v-if="props.file.key" class="mb-3 text-dark fw-900 pe-5" @click="printFile()">
                            <span class="pe-2"></span>
                            Télécharger
                        </a>
                        <a href="#" @click="$emit('close')" class="mb-3 text-dark fw-900" data-bs-dismiss="modal"
                            aria-label="Close">
                            <span class="pe-2"></span>
                            Fermer
                        </a>
                    </div>
                    <embed style="width: 100%; height: 95vh; border: none;" :src="props.file.key"
                        :type="props.file.type" />
                </div>
            </div>
        </template>
    </Modal>

</template>

<script setup>
import Modal from '../profile/Modal.vue';

const props = defineProps({
    file: Object,
    open: Boolean
})

import { fileStore } from '@/stores/file/fileStore';
const store = fileStore()
const { downloadFile } = store
const printFile = async () => {
    await downloadFile(props.file.key, props.file.name)
}
</script>