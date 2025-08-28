<template>
    <Modal v-if="props.open === true">
        <template #body>
            <div
                class="no-scrollbar relative w-full max-w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-5 mx-5">
                <!-- Overlay -->
                <!-- Modal -->
                <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden flex z-50">

                    <!-- Bouton de fermeture -->
                    <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <!-- Partie gauche : contenu principal -->
                    <div class="w-2/3 p-6 overflow-y-auto border-r">
                        <div class="flex justify-between cursor-pointer">
                            <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ feedbackSelect_data?.title }} <Badge
                                    color="primary">Crée le {{ formatTimestampToDate(feedbackSelect_data?.createdAt) }}
                                </Badge>
                            </h2>
                            <h3 v-if="feedbackSelect_data?.session_id">Session : <Badge color="primary"
                                    @click="seeSession(feedbackSelect_data?.session_id?._id)">
                                    {{ feedbackSelect_data?.session_id?.uniqueId }} </Badge>
                            </h3>
                        </div>
                        <div v-if="getFileExtension(feedbackSelect_data?.file?.type) === 'image'">
                            <img :src="feedbackSelect_data?.file?.key" alt="Image du feedback"
                                class="w-full h-64 object-contain rounded-md mb-4" />
                        </div>
                        <div v-else>
                            <video :src="feedbackSelect_data?.file?.key" autoplay="true" controls="true"></video>

                        </div>

                    </div>

                    <!-- Partie droite : onglets -->
                    <div class="w-1/3 flex flex-col">
                        <!-- Tabs -->
                        <div class="flex border-b">
                            <button @click="activeTab = 'details'" :class="tabClass('details')">Détails</button>
                            <!-- <button @click="activeTab = 'comments'" :class="tabClass('comments')">Commentaires</button> -->
                            <button @click="activeTab = 'history'" :class="tabClass('history')">Historique</button>
                            <button @click="activeTab = 'fichiers'" :class="tabClass('fichiers')">Fichiers</button>
                        </div>

                        <!-- Contenu des tabs -->
                        <div class="flex-1 overflow-y-auto p-4">
                            <!-- Tab Détails -->
                            <div v-if="activeTab === 'details'" class="space-y-4">
                                <FeedbackDetail />
                            </div>

                            <!-- Tab Commentaires -->
                            <!-- <div v-if="activeTab === 'comments'" class="space-y-4">
                                <FeedbackComment />
                            </div> -->

                            <!-- Tab Historique -->
                            <div v-if="activeTab === 'history'" class="space-y-3 text-sm text-gray-700">
                                <FeedbackHistory />
                            </div>

                            <div v-if="activeTab === 'fichiers'" class="space-y-3 text-sm text-gray-700">
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
import { onMounted, reactive, ref, watch } from 'vue'
import Modal from '@/components/profile/Modal.vue'
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { storeToRefs } from 'pinia';
import FeedbackDetail from './FeedbackDetail.vue'
const storeFeedback = feedbackStore()
import { projectStore } from '@/stores/project/projectStore';
const storeProject = projectStore()
const { getProjectMember } = storeProject
import FeedbackFiles from './FeedbackFiles.vue';
import FeedbackComment from './FeedbackComment.vue';
import FeedbackHistory from './FeedbackHistory.vue';
const { feedbackSelect_data, project_id } = storeToRefs(storeFeedback)

const { showFeedback, feedbackParams } = storeFeedback
import Badge from '@/components/ui/Badge.vue';
import { formatTimestampToDate } from '@/utils/format';
import { useRouter } from 'vue-router';
onMounted(() => {
    feedbackParams()
})

const props = defineProps({
    feedback: String,
    open: Boolean
})


watch(
    () => props.feedback,
    async (newvalue, oldvalue) => {
        if (newvalue && newvalue !== undefined) {
            await showFeedback()
            getProjectMember(project_id.value)
        }
    }
)

const activeTab = ref('details')

function tabClass(tab) {
    return activeTab.value === tab
        ? 'flex-1 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 py-2'
        : 'flex-1 text-sm text-gray-500 py-2 hover:text-blue-600'
}

const router = useRouter()

const seeSession = (session) => {
    if (session) {
        router.push({ path: '/session/detail', query: { project: project_id.value, session: session } })
    }
}

const getFileExtension = (key) => {
    if (key) {
        const info = key.split('/')
        console.log('info', info)
        return info[0]
    }
}

</script>
