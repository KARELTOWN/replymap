<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-xl font-bold mb-4">
            Informations
          </h4>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Navigateur</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ session?.metadata?.user_agent }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Pays</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{
                session?.metadata?.localization?.country }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Timezone</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{
                session?.metadata?.localization?.timezone }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Région</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ session?.metadata?.localization?.region
              }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Ville</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ session?.metadata?.localization?.city
              }}</p>
            </div>

          </div>
        </div>
      </div>

      <div v-if="loading == false && errorMessage !== ''">
        <div
          class="mb-3 rounded-xl border p-4 border-error-500 bg-error-50 dark:border-error-500/30 dark:bg-error-500/15">
          <div class="flex items-start gap-3">
            <div class="-mt-0.5 text-error-500"><svg className="fill-current" width="24" height="24" viewBox="0 0 24 24"
                fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M20.3499 12.0004C20.3499 16.612 16.6115 20.3504 11.9999 20.3504C7.38832 20.3504 3.6499 16.612 3.6499 12.0004C3.6499 7.38881 7.38833 3.65039 11.9999 3.65039C16.6115 3.65039 20.3499 7.38881 20.3499 12.0004ZM11.9999 22.1504C17.6056 22.1504 22.1499 17.6061 22.1499 12.0004C22.1499 6.3947 17.6056 1.85039 11.9999 1.85039C6.39421 1.85039 1.8499 6.3947 1.8499 12.0004C1.8499 17.6061 6.39421 22.1504 11.9999 22.1504ZM13.0008 16.4753C13.0008 15.923 12.5531 15.4753 12.0008 15.4753L11.9998 15.4753C11.4475 15.4753 10.9998 15.923 10.9998 16.4753C10.9998 17.0276 11.4475 17.4753 11.9998 17.4753L12.0008 17.4753C12.5531 17.4753 13.0008 17.0276 13.0008 16.4753ZM11.9998 6.62898C12.414 6.62898 12.7498 6.96476 12.7498 7.37898L12.7498 13.0555C12.7498 13.4697 12.414 13.8055 11.9998 13.8055C11.5856 13.8055 11.2498 13.4697 11.2498 13.0555L11.2498 7.37898C11.2498 6.96476 11.5856 6.62898 11.9998 6.62898Z"
                  fill="currentColor"></path>
              </svg></div>
            <div>
              <h4 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">Erreur
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400"> {{ errorMessage }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading == true && errorMessage == ''">
        <div
          class="mb-3 rounded-xl border p-4 border-blue-light-500 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/15">
          <div class="flex items-start gap-3">
            <div class="-mt-0.5 text-blue-light-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z"
                  fill="currentColor"></path>
              </svg></div>
            <div>
              <h4 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">Chargement en cours
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div v-if="session_errors.length > 0" class="mt-6">
        <h2 class="text-xl font-bold mb-4">Liste des Requêtes (Erreurs)</h2>

        <div class="overflow-x-auto rounded-lg border border-gray-300">
          <table class="min-w-full table-auto text-sm text-left text-gray-800">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2">URL</th>
                <th class="px-4 py-2 text-center">Méthode</th>
                <th class="px-4 py-2 text-center">Durée</th>
                <th class="px-4 py-2 text-center">Status</th>
                <th class="px-4 py-2 text-center">Status Text</th>
                <th class="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(req, index) in session_errors" :key="req._id" class="border-t hover:bg-gray-50">
                <td class="px-4 py-2 max-w-[250px] truncate">{{ req.general.url }}</td>
                <td class="px-4 py-2 text-center">{{ req.general.method }}</td>
                <td class="px-4 py-2 text-center">{{ req.response.duration }}</td>
                <td class="px-4 py-2 text-center">{{ req.response.status }}</td>
                <td class="px-4 py-2 text-center">{{ req.response.statusText }}</td>
                <td class="px-4 py-2 text-center">
                  <button type="button" @click="openModal(index)"
                    class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    <svg class="fill-gray-400 dark:fill-gray-300" width="30" height="30" viewBox="0 0 20 20" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal -->
        <Modal v-if="selectedRequest !== null">
          <template #body>
            <div
              class="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
              <h5 class="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                Détail Requête
              </h5>
              <div class="custom-scrollbar h-[458px] overflow-y-auto p-2">
                <div class="space-y-2 text-sm">
                  <p><strong>URL:</strong> {{ currentRequest.general.url }}</p>
                  <p><strong>Méthode:</strong> {{ currentRequest.general.method }}</p>
                  <p><strong>Durée:</strong> {{ currentRequest.response.duration }}</p>
                  <p>
                    <strong>Status:</strong> {{ currentRequest.response.status }} -
                    {{ currentRequest.response.statusText }}
                  </p>
                  <div>
                    <p class="mb-1"><strong>Body:</strong></p>
                    <pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ currentRequest.general.body }}</pre>
                  </div>

                  <div>
                    <p class="mb-1"><strong>Headers:</strong></p>
                    <pre
                      class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ currentRequest.general.headers }}</pre>
                  </div>
                  <div>
                    <p class="mb-1"><strong>Réponse:</strong></p>
                    <pre
                      class="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{{ currentRequest.response.response }}</pre>
                  </div>

                </div>

                <div class="mt-6 text-right">
                  <button @click="selectedRequest = null" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </template>
        </Modal>
      </div>


    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import { useRoute } from 'vue-router';
import Modal from '../profile/Modal.vue';

const store = sessionStore()
const { session, session_errors } = storeToRefs(store)
const { showErrors } = store
const loading = ref(false)
const errorMessage = ref('')
const project_id = ref('')
const session_id = ref('')
const route = useRoute()

onMounted(async () => {

  session_id.value = route.query.session
  project_id.value = route.query.project
  errorMessage.value = ''
  if (!session_id.value || !project_id.value) {
    errorMessage.value = "Impossible de charger les erreurs"
    return
  }
  loading.value = true
  try {
    await showErrors({ session: session_id.value, project: project_id.value })
    loading.value = false
    if (Array.isArray(session_errors.value) && session_errors.value.length == 0) {
      errorMessage.value = 'Aucune donnée à chargée'
    }
    else {
      errorMessage.value = ''
    }
  }
  catch (error) {
    errorMessage.value = "Erreur lors du chargement des données"
    console.error(error)
    loading.value = false
  }

})

const selectedRequest = ref(null)

const openModal = (index) => {
  selectedRequest.value = index
}

const currentRequest = computed(() => {
  if (selectedRequest.value !== null) {
    return session_errors.value[selectedRequest.value]
  }
  return null
})

</script>
