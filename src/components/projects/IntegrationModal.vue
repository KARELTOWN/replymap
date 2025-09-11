<!-- <template>
    <Modal v-if="isOpen">
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
                            <p> <Button variant="outline" @click="openLoginFrame"
                                    v-if="reconnexion === true">Reconnecter</Button> </p>
                            <p v-if="errors.integration" style="color: red">{{ errors.integration }}</p>
                        </div>

                        <div>
                            <SimpleSelect :data="boards" label="Liste des tableaux (BOARDS)" optionTextAttr="libelle"
                                optionValueAttr="libelle" @change="getBoardValue" />
                            <p v-if="errors.board" style="color: red">{{ errors.board }}</p>

                        </div>

                    </div>

                    <div class="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
                        <button @click="isOpen = false"
                            class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto">
                            Fermer
                        </button>

                        <button type="submit" :disabled="disableBtn || !form.board || !form.integration"
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
import { errorNotify } from '@/utils/notification';
import { storeToRefs } from 'pinia';
import { onMounted, reactive, ref, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import Button from '../ui/Button.vue';
const store = integrationStore()
const { getIntegrationUrls, getBoards } = store
const { integrationLogins, boards, integrationsList, errors, reconnexion } = storeToRefs(store)

const route = useRoute()
const props = defineProps({
    project: {
        type: Object,
        required: true
    },
    open: {
        type: Boolean,
        required: true
    }
})

const defaultIntegration = ref('')

onMounted(() => {
    resetData()
    if (route.query.integration && route.query.project) {
        defaultIntegration.value = route.params.integration
        form.integration = defaultIntegration.value
        form.project_id = route.query.project
        getBoardList(defaultIntegration.value)
    }
})

const form = reactive(
    {
        integration: '',
        project_id: '',
        board: ''
    }
)

const isOpen = ref(false)

watchEffect(() => {
    if (props.project && props.project !== undefined) {
        form.project_id = props.project._id
    }
    isOpen.value = props.open
})

const resetData = () => {
    errors.value = []
    reconnexion.value = false
}


const getBoardList = async (integration) => {
    try {
        resetData()
        let data = { project_id: form.project_id, integration }
        form.integration = integration
        await getBoards(data)
    }
    catch (err) {
        throw new Error()
    }
}

const openLoginFrame = async () => {
    try {
        if (form.project_id && form.integration) {
            await getIntegrationUrls(form.integration, form.project_id)
            if (integrationLogins.value[integration]) {
                window.open(integrationLogins.value[integration], "_blank", "noopener,noreferrer");
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

</script> -->