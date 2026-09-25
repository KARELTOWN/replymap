<template>
    <Modal v-if="props.open === true">
        <template #body>
            <!-- A sheet on a phone, a card from `lg`. The capture is the subject,
                 so it gets the room; what can be read or edited sits beside it,
                 under a header that carries the context once, not twice. -->
            <div
                class="relative mx-0 flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-gray-900 sm:mx-4 sm:h-[88vh] sm:rounded-2xl lg:h-[85vh]">

                <header
                    class="flex items-start gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800 sm:px-6 sm:py-4">
                    <div class="min-w-0 flex-1">
                        <h2 class="truncate text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg"
                            :title="feedbackSelect_data?.title">
                            {{ feedbackSelect_data?.title || 'Feedback' }}
                        </h2>

                        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span v-if="feedbackSelect_data?.type?.libelle"
                                class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                                {{ feedbackSelect_data.type.libelle }}
                            </span>
                            <span v-if="feedbackSelect_data?.status?.libelle"
                                class="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                                {{ feedbackSelect_data.status.libelle }}
                            </span>
                            <span v-if="author.name" :title="author.email">
                                {{ author.name }}
                                <span v-if="author.guest"
                                    class="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">
                                    invité
                                </span>
                            </span>
                            <span>{{ formatTimestampToDate(feedbackSelect_data?.createdAt) }}</span>
                            <button v-if="feedbackSelect_data?.session_id" type="button"
                                class="font-medium text-brand-500 hover:underline"
                                @click="seeSession(feedbackSelect_data?.session_id?._id)">
                                Voir la session
                            </button>
                        </div>
                    </div>

                    <button type="button" aria-label="Fermer" @click="$emit('close')"
                        class="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"
                                stroke-linecap="round" />
                        </svg>
                    </button>
                </header>

                <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
                    <!-- Capture -->
                    <div
                        class="flex min-h-[38vh] shrink-0 items-center justify-center border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 lg:min-h-0 lg:flex-1 lg:border-b-0 lg:border-r lg:p-6">
                        <p v-if="!feedbackSelect_data?.file?.key"
                            class="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            Aucune capture n'est jointe à ce feedback.
                        </p>

                        <button v-else-if="captureKind === 'image'" type="button" title="Agrandir la capture"
                            class="group relative flex h-full w-full items-center justify-center"
                            @click="showCapture = true">
                            <img :src="feedbackSelect_data.file.key" alt="Capture du feedback"
                                class="max-h-full max-w-full rounded-lg object-contain shadow-sm ring-1 ring-black/5 transition group-hover:brightness-95" />
                            <span
                                class="absolute bottom-2 right-2 rounded-md bg-gray-900/70 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                                Agrandir
                            </span>
                        </button>

                        <video v-else :src="feedbackSelect_data.file.key" controls
                            class="max-h-full w-full rounded-lg shadow-sm ring-1 ring-black/5"></video>

                        <FileFrame v-if="feedbackSelect_data?.file?.key" :file="feedbackSelect_data.file"
                            :open="showCapture" @close="showCapture = false" />
                    </div>

                    <!-- Détails et fichiers -->
                    <div class="flex min-h-0 flex-1 flex-col lg:w-[380px] lg:flex-none xl:w-[420px]">
                        <div class="flex shrink-0 border-b border-gray-200 px-2 dark:border-gray-800">
                            <button type="button" @click="activeTab = 'details'" :class="tabClass('details')">
                                Détails
                            </button>
                            <button type="button" @click="activeTab = 'fichiers'" :class="tabClass('fichiers')">
                                Fichiers
                                <span v-if="fileCount"
                                    class="ml-1 rounded-full bg-gray-100 px-1.5 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                                    {{ fileCount }}
                                </span>
                            </button>
                        </div>

                        <div class="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
                            <div v-if="activeTab === 'details'" class="space-y-5">
                                <FeedbackDetail @deleted="$emit('close')" />
                            </div>
                            <div v-else class="text-sm text-gray-700 dark:text-gray-300">
                                <FeedbackFiles />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Modal from '@/components/profile/Modal.vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { storeToRefs } from 'pinia';
import FeedbackDetail from './FeedbackDetail.vue'
import FeedbackFiles from './FeedbackFiles.vue';
import FileFrame from '@/components/Element/FileFrame.vue';
import { formatTimestampToDate } from '@/utils/format';
import { feedbackAuthor } from '@/utils/authorLabel';
import { useRouter } from 'vue-router';

const storeFeedback = feedbackStore()
const { feedbackSelect_data, feedbackSelect_files, project_id } = storeToRefs(storeFeedback)
const { showFeedback, feedbackParams } = storeFeedback

onMounted(() => {
    feedbackParams()
})

const props = defineProps({
    feedback: String,
    open: Boolean
})

watch(
    () => props.feedback,
    async (newvalue) => {
        if (newvalue && newvalue !== undefined) {
            await showFeedback()
        }
    }
)

const activeTab = ref('details')
const showCapture = ref(false)

const fileCount = computed(() => feedbackSelect_files.value?.length ?? 0)

// Guest feedback has no account behind it: the email typed in the widget is
// the identity, and the badge says so.
const author = computed(() => feedbackAuthor(feedbackSelect_data.value))

// The stored type is a MIME type ("image/png", "video/webm").
const captureKind = computed(() =>
    (feedbackSelect_data.value?.file?.type ?? '').startsWith('image/') ? 'image' : 'video',
)

function tabClass(tab) {
    return activeTab.value === tab
        ? 'flex items-center gap-1 border-b-2 border-brand-500 px-3 py-2.5 text-sm font-semibold text-brand-600 dark:text-brand-400'
        : 'flex items-center gap-1 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
}

const router = useRouter()

const seeSession = (session) => {
    if (session) {
        router.push({ path: '/session/detail', query: { project: project_id.value, session: session } })
    }
}
</script>
