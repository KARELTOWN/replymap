<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 w-auto">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 class="text-xl font-bold mb-4">
            Informations
          </h4>

          <Metadata :metadata="session?.metadata" :user_agent="true" :localization="true"/>

        </div>
      </div>
    </div>
    <div class="w-auto">
      <SessionErrors />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import SessionErrors from './SessionErrors.vue';
import Metadata from '@/components/Element/Metadata.vue'
const store = sessionStore()
const { session } = storeToRefs(store)

</script>
