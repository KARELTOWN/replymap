<template>
    <AdminLayout>
        <PageHeader title="Intégrations"
            description="Reliez un projet à Trello pour que chaque retour devienne une carte, et que les statuts restent alignés des deux côtés." />

        <div class="max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <form class="flex flex-col" @submit.prevent="handleSubmit">
                    <div class="mt-8">
                        <div>
                            <SimpleSelect :data="integrationsList" label="Liste des intégrations"
                                optionTextAttr="libelle" optionValueAttr="id" @change="getBoardList"
                                :defaultValue="defaultIntegration" />
                            <p class="mt-2"> <Button type="button" variant="outline" @click="openLoginFrame"
                                    v-if="reconnexion === true">Connecter
                                    {{ form.integration }}</Button> </p>
                            <p v-if="errors.integration" style="color: red">{{ errors.integration }}</p>
                        </div>

                        <div class="mt-5" v-if="boards.length > 0">
                            <SimpleSelect :data="boards" label="Liste des tableaux (BOARDS)" optionTextAttr="name"
                                optionValueAttr="id" @change="getBoardValue" :defaultValue="defaultBoard" />
                            <p v-if="errors.board" style="color: red">{{ errors.board }}</p>

                        </div>

                        <div class="mt-5" v-if="lists.length > 0">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Correspondance listes ↔ statuts : la carte suit le statut déplacé dans le
                                kanban BugReveal, et le statut suit la carte déplacée dans Trello.
                            </label>
                            <div v-for="list in lists" :key="list.id"
                                class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <span class="w-full truncate text-sm text-gray-700 dark:text-gray-300 sm:w-1/2">{{ list.name }}</span>
                                <select v-model="mappingByList[list.id]"
                                    class="text-gray-800 dark:text-white/90 dark:bg-dark-900 h-11 w-full rounded-lg sm:w-1/2 border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700">
                                    <option value="">Ignorer</option>
                                    <option v-for="s in feedbackStatus" :key="s._id" :value="s._id">{{ s.libelle }}</option>
                                </select>
                            </div>
                            <Button type="button" variant="outline" @click="saveMapping">
                                Enregistrer la correspondance
                            </Button>
                        </div>

                        <!-- <div class="mt-5" v-if="form.board">
                            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                <div class="col-span-2">
                                    <label for="">Nom de l'étiquette</label>
                                    <input type="text" v-model="labelName"
                                        class="dark:bg-dark-900 w-full rounded-lg border border-error-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-error-300 focus:outline-hidden focus:ring-3 focus:ring-error-500/10 dark:border-error-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-error-800" />
                                    <p v-if="errors.libelle" style="color: red">{{ errors.libelle }}</p>

                                </div>
                                <div class="col-span-1">
                                    <SimpleSelect :data="colorList" label="Couleur"
                                        optionTextAttr="libelle" optionValueAttr="color" @change="getColor" />
                                    <p v-if="errors.color" style="color: red">{{ errors.color }}</p>
                                </div>
                                <div class="col-span-2">
                                    <Button type="button" variant="primary"
                                        :disabled="labelName == '' || labelColor == ''" @click="createLabel">Créer une
                                        étiquette</Button>
                                </div>
                            </div>
                            <div v-if="labels.length > 0">
                                <pre>{{ labels }}</pre>
                            </div>


                        </div>
                        <p v-if="errors.board" style="color: red">{{ errors.board }}</p> -->


                    </div>

                    <div class="mt-4">
                        <p v-if="errors.project_id" class="text-sm text-error-500">{{ errors.project_id }}</p>
                        <p v-if="errors.integration" class="text-sm text-error-500">{{ errors.integration }}</p>
                        <!-- <div v-if="errors.integration">
                            <pre>
                                {{ errors.integration }}
                            </pre>
                        </div> -->
                    </div>


                    <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                        <router-link to="/projets"
                            class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">
                            Annuler
                        </router-link>

                        <button type="submit" :disabled="disableBtn"
                            class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto">
                            Enregistrer
                        </button>
                    </div>
                </form>
        </div>
    </AdminLayout>
</template>

<script setup>
import { integrationStore } from '@/stores/integration/integrationStore';
import { feedbackStore } from '@/stores/feedback/feedbackStore.ts';
import { errorNotify, warningNotify } from '@/utils/notification';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import PageHeader from '@/components/common/PageHeader.vue';
import Button from '@/components/ui/Button.vue';
import SimpleSelect from '@/components/Element/Form/SimpleSelect.vue';
import Alert from '@/components/ui/Alert.vue';
import router from '@/router';
const store = integrationStore()
const {
    getIntegrationUrls, getBoards, updateIntegration, getBoardLabels, createBoardLabel,
    getBoardLists, updateStatusMapping,
} = store
const {
    integrationLogins, boards, integrationsList, errors, reconnexion, defaultBoard, labels,
    lists, statusMapping,
} = storeToRefs(store)

const storeFeedback = feedbackStore()
const { feedbackParams } = storeFeedback
const { feedbackStatus } = storeToRefs(storeFeedback)

const route = useRoute()

watchEffect(() => {
    if (defaultBoard.value !== null) {
        getBoardValue(defaultBoard.value)
    }
})

const defaultIntegration = ref('')
const disableBtn = ref(false)

const form = reactive(
    {
        integration: '',
        project_id: '',
        board: ''
    }
)

const labelName = ref('')
const labelColor = ref('')

const colorList = reactive(
    [
        { color: "green", libelle: "GREEN" },
        { color: "yellow", libelle: "YELLOW" },
        { color: "orange", libelle: "ORANGE" },
        { color: "red", libelle: "RED" },
        { color: "purple", libelle: "PURPLE" },
        { color: "blue", libelle: "BLUE" },
        { color: "sky", libelle: "SKY" },
        { color: "lime", libelle: "LIME" },
        { color: "pink", libelle: "PINK" },
        { color: "black", libelle: "BLACK" }
    ]
)

const getColor = (color) => {
    labelColor.value = color
}

// The tool is chosen for the user: Trello is the only integration, and the
// select showed it without selecting it. Nothing else was loaded, so the page
// looked empty and saving complained about missing fields.
onMounted(() => {
    resetData()
    feedbackParams()
    // The settings belong to a project: without one there is nothing to
    // configure, so the visitor is sent back to pick it.
    if (!route.query.project) {
        warningNotify("Choisissez le projet dont vous voulez configurer l'intégration")
        router.push({ path: '/projets' })
        return
    }
    form.project_id = route.query.project
    const integration = route.query.integration || integrationsList.value[0]?.id
    if (integration) {
        defaultIntegration.value = integration
        getBoardList(integration)
    }
})



const resetData = () => {
    errors.value = {}
    reconnexion.value = false
    boards.value = []
}


const getBoardList = async (integration) => {
    try {
        resetData()
        const data = { project_id: form.project_id, integration }
        form.integration = integration
        await getBoards(data)
    }
    catch (error) {
        throw new Error(error)
    }
}

const openLoginFrame = async () => {
    try {
        if (form.project_id && form.integration) {
            await getIntegrationUrls(form.integration, form.project_id)
            if (integrationLogins.value[form.integration]) {
                window.open(integrationLogins.value[form.integration], "_blank", "noopener,noreferrer");
            }
            else {
                errorNotify('Intégration non trouvée')
                return
            }
        }
    }
    catch (err) {
        throw new Error(err)
    }
}


const getBoardValue = async (board) => {
    form.board = board
    const data = { integration: form.integration, board: form.board, project_id: form.project_id }
    await getBoardLabels(data)
    // Only reflects the lists when this board is already the one saved on the
    // server (case: reopening the settings of an integration already connected);
    // otherwise get_board_lists still reads the previous board until "Save" is
    // clicked.
    if (board === defaultBoard.value) {
        await getBoardLists({ project_id: form.project_id, integration: form.integration })
    }
}

const createLabel = async () => {
    const data = { ...form, libelle: labelName.value, color: labelColor.value }
    await createBoardLabel(data)
}

// The list -> status mapping only makes sense once the board is saved
// (get_board_lists reads the board persisted on the server, not the current
// selection): the form therefore stays open after saving, instead of
// redirecting, to show it right away.
const mappingByList = reactive({})

watch([lists, statusMapping], () => {
    for (const list of lists.value) {
        if (mappingByList[list.id] === undefined) {
            const existing = statusMapping.value.find((m) => m.list_id === list.id)
            mappingByList[list.id] = existing ? existing.status : ''
        }
    }
})

const saveMapping = async () => {
    const mapping = Object.entries(mappingByList)
        .filter(([, status]) => status)
        .map(([list_id, status]) => ({ list_id, status }))
    await updateStatusMapping({ project_id: form.project_id, integration: form.integration, mapping })
}

// Saying which step is missing: "fill in every field" was shown even when no
// field was on screen yet.
const handleSubmit = async () => {
    if (!form.project_id) {
        warningNotify('Ouvrez cette page depuis un projet pour configurer son intégration')
        return
    }
    if (!form.integration) {
        warningNotify('Choisissez un outil dans la liste des intégrations')
        return
    }
    if (!form.board) {
        warningNotify(
            reconnexion.value
                ? `Connectez ${form.integration} à ce projet avant d'enregistrer`
                : 'Choisissez le tableau qui recevra les cartes',
        )
        return
    }
    disableBtn.value = true
    await updateIntegration(form).then(async () => {
        disableBtn.value = false
        defaultBoard.value = form.board
        await getBoardLists({ project_id: form.project_id, integration: form.integration })
    }).catch(() => {
        disableBtn.value = false
    })

}

onUnmounted(()=> {
    defaultBoard.value = null
    boards.value = []
    lists.value = []
    statusMapping.value = []
    Object.keys(mappingByList).forEach((key) => delete mappingByList[key])
    errors.value = {}
})
</script>