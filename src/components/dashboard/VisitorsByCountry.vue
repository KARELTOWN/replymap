<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
    <div>
      <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Visiteurs par pays</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Répartition des visiteurs uniques sur l'ensemble de vos projets.
      </p>
    </div>

    <template v-if="countries.length > 0">
      <div
        class="my-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div ref="mapOneRef" id="mapOne"
          class="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]">
        </div>
      </div>

      <ul class="space-y-4">
        <li v-for="(country, index) in countries" :key="country._id ?? index"
          class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
              {{ country._id || 'Pays inconnu' }}
            </p>
            <span class="block text-xs text-gray-500 dark:text-gray-400">
              {{ country.visit }} visite{{ country.visit > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="flex w-full max-w-[140px] items-center gap-3">
            <div class="relative h-2 w-full max-w-[100px] overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-800">
              <!-- The bar had a fixed 79% width on every row,
                   whatever the percentage shown right next to it. -->
              <div class="absolute left-0 top-0 h-full rounded-sm bg-brand-500"
                :style="{ width: `${share(country)}%` }"></div>
            </div>
            <p class="w-12 shrink-0 text-right text-sm font-medium text-gray-800 dark:text-white/90">
              {{ share(country) }}%
            </p>
          </div>
        </li>
      </ul>
    </template>

    <!-- The card vanished entirely without data, leaving a hole
         in the dashboard grid. -->
    <p v-else class="mt-6 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
      Aucune donnée de localisation pour le moment.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import jsVectorMap from 'jsvectormap'
import 'jsvectormap/dist/maps/world'
import { useStatStore } from '@/stores/stat/stat.store'
import { storeToRefs } from 'pinia'

const { stat, mapsCountry } = storeToRefs(useStatStore())
const mapOneRef = ref<HTMLElement | null>(null)
const mapInstance = ref<any>(null)

const countries = computed<any[]>(() => stat.value?.user_country ?? [])

// Share of the visits located, not of the distinct visitors: the two counts
// are different (one visitor makes several visits), and dividing by the
// smaller one gave shares above 100% — a 2100% bar ran across the page.
const locatedVisits = computed(() =>
  countries.value.reduce((total: number, country: any) => total + (country.visit ?? 0), 0),
)

const share = (country: any) => {
  const total = locatedVisits.value
  if (!total) return 0
  return Math.min(100, Math.round((country.visit * 100) / total))
}

const initMap = (markers: any) => {
  if (!mapOneRef.value) return
  mapInstance.value = new jsVectorMap({
    selector: mapOneRef.value,
    map: 'world',
    zoomButtons: false,
    regionStyle: {
      initial: { fontFamily: 'Outfit', fill: '#D9D9D9' },
      hover: { fillOpacity: 1, fill: '#465fff' },
    },
    markers: markers,
    markerStyle: {
      initial: { strokeWidth: 1, fill: '#465fff', fillOpacity: 1, r: 4 },
      hover: { fill: '#465fff', fillOpacity: 1 },
      selected: {},
      selectedHover: {},
    },
  })
}

watch(
  () => mapsCountry.value,
  (newValue) => {
    if (newValue.length > 0) initMap(newValue)
  },
)
</script>
