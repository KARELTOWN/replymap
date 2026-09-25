<template>
  <AdminLayout>
    <PageHeader title="Vue d'ensemble"
      description="L'activité de vos projets : sessions enregistrées, événements détectés et retours des utilisateurs." />

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Projets" :value="stat?.projects_count" to="/projets"
        hint="Projets auxquels vous participez">
        <template #icon>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor"
              stroke-width="1.7" stroke-linejoin="round" />
          </svg>
        </template>
      </StatCard>

      <StatCard label="Sessions" :value="stat?.sessions_count" to="/sessions"
        hint="Parcours enregistrés et rejouables">
        <template #icon>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7" />
            <path d="M10.5 9.5l4 2.5-4 2.5V9.5z" fill="currentColor" />
          </svg>
        </template>
      </StatCard>

      <StatCard label="Événements" :value="stat?.events_count" to="/evenements"
        hint="Erreurs et anomalies remontées">
        <template #icon>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4l8.5 15h-17L12 4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            <path d="M12 10v4M12 16.5h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </template>
      </StatCard>

      <StatCard label="Visiteurs uniques" :value="stat?.total_visit" hint="Sur l'ensemble de vos projets">
        <template #icon>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="8" r="3.2" stroke="currentColor" stroke-width="1.7" />
            <path d="M3.5 19c.6-3 3-4.5 5.5-4.5S13.9 16 14.5 19M16 11.2A3.2 3.2 0 1016 5m4.5 14c-.4-2-1.6-3.3-3.2-3.9"
              stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </template>
      </StatCard>
    </div>

    <div class="mt-6 grid grid-cols-12 gap-4 md:gap-6">
      <div class="col-span-12 xl:col-span-5">
        <VisitorsByCountry />
      </div>

      <div class="col-span-12 xl:col-span-7">
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Prochaines étapes</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mettez en place la collecte et invitez les personnes qui testeront votre produit.
          </p>

          <ul class="mt-5 space-y-3">
            <li v-for="step in steps" :key="step.title">
              <router-link :to="step.to"
                class="flex items-start gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-brand-300 dark:border-gray-800 dark:hover:border-brand-500">
                <span
                  class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                  {{ step.index }}
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ step.title }}</span>
                  <span class="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{{ step.description }}</span>
                </span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
// The home page showed the demo components of the original template
// (e-commerce metrics, monthly target, recent orders): labels unrelated to the
// product, two of them imported in place of each other. It is rebuilt on the
// statistics the API actually exposes.
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import VisitorsByCountry from '@/components/dashboard/VisitorsByCountry.vue'
import { useStatStore } from '@/stores/stat/stat.store'

const store = useStatStore()
const { stat } = storeToRefs(store)
const { getStats } = store

const steps = [
  {
    index: 1,
    title: 'Créer un projet',
    description: "Déclarez le site à suivre et copiez le script de suivi à poser sur vos pages.",
    to: '/projets',
  },
  {
    index: 2,
    title: 'Inviter vos testeurs',
    description: 'Seuls les membres invités sur un projet peuvent y déposer un retour.',
    to: '/projets',
  },
  {
    index: 3,
    title: 'Suivre les retours',
    description: 'Classez les retours dans le tableau et synchronisez-les avec Trello.',
    to: '/feedbacks',
  },
]

onMounted(() => {
  getStats()
})
</script>
