<template>
  <div class="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
    <common-grid-shape />

    <div class="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
      <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Erreur 404</p>

      <h1 class="mb-6 text-title-md font-bold text-gray-800 dark:text-white/90 xl:text-title-2xl">
        Cette page n'existe pas
      </h1>

      <img src="/images/error/404.svg" alt="" class="dark:hidden" />
      <img src="/images/error/404-dark.svg" alt="" class="hidden dark:block" />

      <p class="mb-8 mt-10 text-base text-gray-600 dark:text-gray-400 sm:text-lg">
        Le lien est peut-être obsolète, ou la page a été déplacée.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <router-link to="/"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600">
          Retour à la vue d'ensemble
        </router-link>
        <router-link to="/feedbacks"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]">
          Voir les feedbacks
        </router-link>
      </div>
    </div>

    <p class="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
      &copy; {{ currentYear }} BugReveal
    </p>
  </div>
</template>

<script setup>
// The page was entirely in English and credited, in its footer, the admin
// template used at the start, visible to customers.
import { ref } from "vue";
import CommonGridShape from "../../components/common/CommonGridShape.vue";

const currentYear = ref(new Date().getFullYear());
</script>
