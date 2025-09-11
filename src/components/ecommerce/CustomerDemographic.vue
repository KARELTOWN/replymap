<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
    v-if="stat.user_country && stat.user_country.length > 0">
    <div class="flex justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
          Données démographiques
        </h3>
        <p class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Nombre d'utilisateur par pays
        </p>
      </div>
    </div>
    <div
      class="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
      <div ref="mapOneRef" id="mapOne"
        class="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]">
      </div>
    </div>
    <div class="space-y-5">
      <div class="flex items-center justify-between" v-for="(data, index) in stat.user_country" :key="index">
        <div class="flex items-center gap-3">
          <div class="items-center w-full rounded-full max-w-8">
          </div>
          <div>
            <p class="font-semibold text-gray-800 text-theme-sm dark:text-white/90">{{ data._id }}</p>
            <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
              {{ data.visit }}
            </span>
          </div>
        </div>

        <div class="flex w-full max-w-[140px] items-center gap-3">
          <div class="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
            <div
              class="absolute left-0 top-0 flex h-full w-[79%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white">
            </div>
          </div>
          <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ pourcentage(index) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import jsVectorMap from 'jsvectormap'
import 'jsvectormap/dist/maps/world'
import { useStatStore } from '@/stores/stat/stat.store'
import { storeToRefs } from 'pinia'

const { stat, mapsCountry } = storeToRefs(useStatStore())
const mapOneRef = ref<HTMLElement | null>(null)
const mapInstance = ref<any>(null)

const pourcentage = (index) => {
  return (stat.value.user_country[index].visit * 100) / stat.value.total_visit
}

const initMap = (markers) => {
  if (mapOneRef.value) {
    mapInstance.value = new jsVectorMap({
      selector: mapOneRef.value,
      map: 'world',
      zoomButtons: false,
      regionStyle: {
        initial: {
          fontFamily: 'Outfit',
          fill: '#D9D9D9',
        },
        hover: {
          fillOpacity: 1,
          fill: '#465fff',
        },
      },
      markers: markers,
      markerStyle: {
        initial: {
          strokeWidth: 1,
          fill: '#465fff',
          fillOpacity: 1,
          r: 4,
        },
        hover: {
          fill: '#465fff',
          fillOpacity: 1,
        },
        selected: {},
        selectedHover: {},
      },
      onRegionTooltipShow: function (event: MouseEvent, tooltip: any) {
        const code = (event.target as HTMLElement).getAttribute('data-code')
        // if (code === 'EG') {
        //   tooltip.setContent(tooltip.text() + ' (Hello Egypt)')
        // }
      },
    })
  }
}

onMounted(() => {
})


watch(
  () => mapsCountry.value,
  (newValue, oldvalue) => {
    if (newValue.length > 0) {
      initMap(newValue)
    }
  }
)

</script>
