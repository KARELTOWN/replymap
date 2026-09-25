<template>
    <!-- Title and description are editable: feedback written in a hurry
         from the widget deserves rewording before it is handled. -->
    <div>
        <label for="feedback-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
        <input id="feedback-title" v-model="titleDraft" type="text" maxlength="200"
            class="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" />
        <p v-if="titleError" class="mt-1 text-xs text-error-500">{{ titleError }}</p>
    </div>

    <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <div v-if="!editingDescription" class="mt-1 text-sm leading-relaxed text-gray-700"
            v-html="sanitizedDescription"></div>
        <div v-else ref="descriptionEditor" contenteditable="true"
            class="mt-1 max-h-60 min-h-24 overflow-y-auto rounded-lg border border-gray-300 p-3 text-sm leading-relaxed text-gray-700 focus:border-brand-300 focus:outline-hidden dark:border-gray-700"></div>
        <button type="button" class="mt-1 text-xs font-medium text-brand-500 hover:underline"
            @click="toggleDescriptionEditing">
            {{ editingDescription ? 'Terminer la modification' : 'Modifier la description' }}
        </button>
    </div>

    <div v-if="isDirty" class="flex items-center gap-2">
        <button type="button" @click="saveContent"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
            Enregistrer
        </button>
        <button type="button" @click="resetDrafts"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
            Annuler
        </button>
    </div>

    <div>
        <SimpleSelect :data="feedbackTypes" label="Type" optionTextAttr="libelle" optionValueAttr="_id"
            @change="getTypeValue" :defaultValue="feedbackSelect_data?.type?._id" />
    </div>
    <div>
        <SimpleSelect :data="feedbackStatus" label="Statut" optionTextAttr="libelle" optionValueAttr="_id"
            @change="getStatusValue" :defaultValue="feedbackSelect_data?.status?._id" />
    </div>

    <div v-if="feedbackSelect_data?.integration_card_id" class="flex items-center gap-2">
        <Badge color="success">Synchronisé avec Trello</Badge>
        <!-- Detailed tracking happens in Trello: link straight to it
             rather than duplicating it here. -->
        <a v-if="feedbackSelect_data?.integration_card_url" :href="feedbackSelect_data.integration_card_url"
            target="_blank" rel="noopener noreferrer" class="text-sm font-medium text-brand-500 hover:underline">
            Ouvrir la carte
        </a>
    </div>
    <div v-else-if="lists.length > 0" class="space-y-2">
        <SimpleSelect :data="lists" label="Envoyer vers Trello" optionTextAttr="name" optionValueAttr="id"
            defaultOptionText="Choisir une liste" @change="getSendListValue" :defaultValue="sendListId" />
        <button type="button" :disabled="!sendListId" @click="sendToTrello"
            class="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
            Envoyer vers Trello
        </button>
    </div>

    <div class="border-t border-gray-100 pt-4 dark:border-gray-800">
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Contexte de la capture</p>
        <Metadata :metadata="feedbackSelect_data?.metadata" :user_agent="true" :localization="false"
            :url="feedbackSelect_data?.url" />
    </div>

    <!-- Deletion: a duplicate or a test submission has no business cluttering the
         tracking board. The card created in Trello is left untouched. -->
    <div class="border-t border-gray-100 pt-4 dark:border-gray-800">
        <button v-if="!confirmingDelete" type="button" @click="confirmingDelete = true"
            class="text-sm font-medium text-error-500 hover:underline">
            Supprimer ce feedback
        </button>
        <div v-else class="space-y-2">
            <p class="text-sm text-gray-700 dark:text-gray-300">
                Supprimer définitivement ce feedback et ses fichiers ?
                <span v-if="feedbackSelect_data?.integration_card_id">
                    La carte Trello associée, elle, sera conservée.
                </span>
            </p>
            <div class="flex items-center gap-2">
                <button type="button" @click="removeFeedback"
                    class="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-error-600">
                    Supprimer
                </button>
                <button type="button" @click="confirmingDelete = false"
                    class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
                    Annuler
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { integrationStore } from '@/stores/integration/integrationStore.ts';
import SimpleSelect from '@/components/Element/Form/SimpleSelect.vue';
import { storeToRefs } from 'pinia';
import Badge from '@/components/ui/Badge.vue';
import Metadata from '@/components/Element/Metadata.vue'
import DOMPurify from 'dompurify'

const emit = defineEmits(['deleted'])

const storeFeedback = feedbackStore()
const storeIntegration = integrationStore()

const { feedbackSelect_data, feedbackTypes, feedbackDetailForm, feedbackStatus, feedbackSelect, project_id } = storeToRefs(storeFeedback)
const { updateFeedback, deleteFeedback, sendFeedbackToIntegration } = storeFeedback
const { lists } = storeToRefs(storeIntegration)
const { getBoardLists } = storeIntegration

// The description may contain HTML (rich editor of the feedback widget): it is
// sanitised before rendering to prevent any injection, and again before saving
// since it becomes editable.
const sanitizedDescription = computed(() => DOMPurify.sanitize(feedbackSelect_data.value?.description || ''))

const titleDraft = ref('')
const descriptionDraft = ref('')
const editingDescription = ref(false)
const descriptionEditor = ref(null)
const confirmingDelete = ref(false)
const titleError = ref('')

const resetDrafts = () => {
    titleDraft.value = feedbackSelect_data.value?.title || ''
    descriptionDraft.value = sanitizedDescription.value
    editingDescription.value = false
    titleError.value = ''
}

watch(feedbackSelect_data, resetDrafts, { immediate: true })

const isDirty = computed(() => {
    if (!feedbackSelect_data.value) return false
    return (
        titleDraft.value !== (feedbackSelect_data.value.title || '') ||
        descriptionDraft.value !== sanitizedDescription.value
    )
})

// The rich field is filled by hand: binding it with v-model would move the
// cursor back to the start on every keystroke.
const toggleDescriptionEditing = async () => {
    if (editingDescription.value) {
        descriptionDraft.value = DOMPurify.sanitize(descriptionEditor.value?.innerHTML || '')
        editingDescription.value = false
        return
    }
    editingDescription.value = true
    await nextTick()
    if (descriptionEditor.value) {
        descriptionEditor.value.innerHTML = descriptionDraft.value
        descriptionEditor.value.focus()
    }
}

const saveContent = async () => {
    titleError.value = ''
    if (editingDescription.value) await toggleDescriptionEditing()

    const title = titleDraft.value.trim()
    if (title.length < 3) {
        titleError.value = 'Le titre doit faire au moins 3 caractères'
        return
    }

    await updateFeedback(feedbackSelect.value, {
        title,
        description: DOMPurify.sanitize(descriptionDraft.value),
    })
    if (feedbackSelect_data.value) {
        feedbackSelect_data.value.title = title
        feedbackSelect_data.value.description = descriptionDraft.value
    }
}

const removeFeedback = async () => {
    const removed = await deleteFeedback(feedbackSelect.value)
    confirmingDelete.value = false
    if (removed) emit('deleted')
}

const getTypeValue = (value) => {
    feedbackDetailForm.value.type = value
    modifyFeedback({ type: value })
}

const getStatusValue = (value) => {
    feedbackDetailForm.value.status = value
    modifyFeedback({ status: value })
}

const modifyFeedback = (data) => {
    updateFeedback(feedbackSelect.value, data)
}

// Trello lists only make sense when an integration is connected to the
// project; without one the store stays empty and the block above simply does
// not show (no blocking call, no visible error).
onMounted(() => {
    if (project_id.value) {
        getBoardLists({ project_id: project_id.value, integration: 'trello' })
    }
})

const sendListId = ref('')
const getSendListValue = (value) => {
    sendListId.value = value
}

const sendToTrello = () => {
    if (!sendListId.value) return
    sendFeedbackToIntegration(feedbackSelect.value, { integration: 'trello', list_id: sendListId.value })
}
</script>
