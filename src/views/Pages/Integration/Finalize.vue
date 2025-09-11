<template>
    <h1 class="text-3xl flex justify-center my-5">Intégration de {{ $route.params.integration }} à BUGREVEAL</h1>
    <div v-if="integrationSuccess === false && loading === true" class="flex justify-center mt-5">
        <div class="loader-animation"></div>
    </div>
    <div v-if="integrationSuccess === false && loading === false" class="flex justify-center mt-5">
        <Alert variant="error">L'intégration a échouée. Veuillez rééssayer</Alert>
        <router-link to="/projects">Revenez à la liste des projets</router-link>
    </div>
    <div v-if="integrationSuccess === true && loading === false" class="flex flex-col justify-center my-5">
        <h1 class="text-2xl">L'intégration de {{ $route.params.integration }} à BUGREVEAL a réussie</h1>
        <div class="text-xl font-bold text-brand-600 mt-4">Vous serez rediriger dans 2 secondes</div>
    </div>
</template>

<script setup>
import { errorNotify } from '@/utils/notification';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { integrationStore } from '@/stores/integration/integrationStore';
import { storeToRefs } from 'pinia';
import Alert from '@/components/ui/Alert.vue';
const storeIntegration = integrationStore()
const { storeToken } = storeIntegration
const { integrationSuccess } = storeToRefs(storeIntegration)
const route = useRoute()
const router = useRouter()

onMounted(() => {
    store()
})

const loading = ref(false)

const store = async () => {
    try {
        if (route.params.project_id && route.params.integration) {
            let href = window.location.href
            let data = href.split('#token=')
            let token = data[1]
            loading.value = true
            await storeToken({ project_id: route.params.project_id, token: token, integration: route.params.integration })
            if (integrationSuccess.value === true) {
                loading.value = false
                setTimeout(() => {
                    router.push({ path: '/integration-configuration', query: { integration: route.params.integration, project: route.params.project_id } })
                }, 2000);
            }
            else {
                loading.value = false
            }
        }
        else {
            errorNotify('Intégration Impossible')
        }
    }

    catch (err) {
        loading.value = false
        throw new Error(err)
    }
}
</script>