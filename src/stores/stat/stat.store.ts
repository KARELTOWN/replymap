import { fetchGet } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatStore = defineStore('stat-store', () => {
  const stat = ref({})
  const getStats = async () => {
    try {
      const result = await fetchGet(`stat/get`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          stat.value = response.data
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  return {
    getStats,
    stat
  }
})
