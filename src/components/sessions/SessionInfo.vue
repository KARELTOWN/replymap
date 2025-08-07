<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-xl font-bold mb-4">
            Informations
          </h4>

          <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-7 2xl:gap-x-32">
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

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Hauteur écran</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ session?.metadata?.availHeight
              }}</p>
            </div>

            <div>
              <p class="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Largeur écran</p>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ session?.metadata?.availWidth
              }}</p>
            </div>

          </div>
        </div>
      </div>

      <SessionErrors />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import SessionErrors from './SessionErrors.vue';

const store = sessionStore()
const { session } = storeToRefs(store)

</script>
