import { fetchGet } from '@/composables/request'
import { getManyCountryCoords } from '@/utils/country'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatStore = defineStore('stat-store', () => {
  const stat: any = ref({})
  const mapsCountry = ref([])
  const getStats = async () => {
    try {
      mapsCountry.value = []
      const result = await fetchGet(`stat/get`)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          stat.value = response.data
          if (stat.value.user_country && stat.value.user_country.length > 0) {
            let countryNames = stat.value.user_country.map((e:any) => {
              e._id
            })
            mapsCountry.value = getManyCountryCoords(countryNames)
          }
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  return {
    getStats,
    stat,
    mapsCountry,
  }
})
