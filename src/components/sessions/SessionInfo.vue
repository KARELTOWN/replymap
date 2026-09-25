<template>
  <!-- Two cards side by side on a wide screen: the visitor's setup, and what
       failed during the session. They used to be stacked full width, with the
       metadata grid pushing the errors table far below the fold. -->
  <div class="grid gap-6 xl:grid-cols-2">
    <section
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Contexte du visiteur</h4>
      <Metadata :metadata="session?.metadata" :user_agent="true" :localization="true" />
    </section>

    <section
      class="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <SessionErrors />
    </section>
  </div>
</template>

<script setup>
import { sessionStore } from "@/stores/session/sessionStore";
import { storeToRefs } from "pinia";
import SessionErrors from './SessionErrors.vue';
import Metadata from '@/components/Element/Metadata.vue'

const store = sessionStore()
const { session } = storeToRefs(store)
</script>
