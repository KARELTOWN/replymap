<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <!-- Header -->
    <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 text-center mb-8">
      Intégration de <span class="text-blue-600">{{ $route.params.integration }}</span> à BUGREVEAL
    </h1>

    <!-- Loader -->
    <div v-if="integrationSuccess === false && loading === true" class="flex justify-center">
      <div class="loader-animation w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-if="integrationSuccess === false && loading === false" class="flex flex-col items-center text-center space-y-4">
      <div class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
        L'intégration a échouée. Veuillez rééssayer.
      </div>
      <router-link 
        to="/projets" 
        class="text-blue-600 hover:underline font-semibold"
      >
        Revenez à la liste des projets
      </router-link>
    </div>

    <!-- Success -->
    <div v-if="integrationSuccess === true && loading === false" class="flex flex-col items-center text-center space-y-4">
      <div class="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-md text-xl sm:text-2xl font-semibold">
        L'intégration de <span class="text-green-600">{{ $route.params.integration }}</span> à BUGREVEAL a réussie
      </div>
      <div class="text-gray-700 mt-2 text-lg sm:text-xl">
        Vous serez redirigé dans 2 secondes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { errorNotify } from '@/utils/notification';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { integrationStore } from '@/stores/integration/integrationStore';
import { storeToRefs } from 'pinia';
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
            const href = window.location.href
            const data = href.split('#token=')
            const token = data[1]
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

    catch (err: any) {
        loading.value = false
        throw new Error(err)
    }
}
</script>