<template>
    <Modal>
        <template #body>
            <div
                class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <h5 class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                    Intégrations
                </h5>
                <form class="flex flex-col custom-scrollbar max-h-[458px] overflow-y-auto p-2"
                    @submit.prevent="handleSubmit">
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
                        <div v-if="errors.project_id || errors.integration">
                            <pre>
                                {{ errors }}
                            </pre>
                        </div>
                        <!-- <div v-if="errors.integration">
                            <pre>
                                {{ errors.integration }}
                            </pre>
                        </div> -->
                    </div>


                    <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                        <router-link to="/projets"
                            class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">
                            Fermer
                        </router-link>

                        <button type="submit" :disabled="disableBtn"
                            class="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto">
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </template>
    </Modal>
</template>

<script setup>
import { integrationStore } from '@/stores/integration/integrationStore';
import { errorNotify, warningNotify } from '@/utils/notification';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, reactive, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import Modal from '@/components/profile/Modal.vue';
import Button from '@/components/ui/Button.vue';
import SimpleSelect from '@/components/Element/Form/SimpleSelect.vue';
import Alert from '@/components/ui/Alert.vue';
import router from '@/router';
const store = integrationStore()
const { getIntegrationUrls, getBoards, updateIntegration, getBoardLabels, createBoardLabel } = store
const { integrationLogins, boards, integrationsList, errors, reconnexion, defaultBoard, labels } = storeToRefs(store)

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

onMounted(() => {
    resetData()
    if (route.query.project) {
        form.project_id = route.query.project
    }
    if (route.query.integration) {
        defaultIntegration.value = route.query.integration
        getBoardList(defaultIntegration.value)
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
}

const createLabel = async () => {
    const data = { ...form, libelle: labelName.value, color: labelColor.value }
    await createBoardLabel(data)
}

const handleSubmit = async () => {
    if (!form.project_id || !form.integration || !form.board) {
        warningNotify('Veuillez renseigner tous les champs')
        return
    }
    disableBtn.value = true
    await updateIntegration(form).then(() => {
        disableBtn.value = false
        setTimeout(() => {
            router.push({ path: '/projets' })
        }, 1000)
    }).catch(() => {
        disableBtn.value = false
    })

}

onUnmounted(()=> {
    defaultBoard.value = null
    boards.value = []
    errors.value = {}
})
</script>