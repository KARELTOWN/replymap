import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGet } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'

export const feedbackHistoryStore = defineStore('feedbackHistory-store', () => {
  let history = ref([])
  let reload = ref(false)

  const feedbackHistory = async (feedback) => {
    try {
      const result = await fetchGet(`feedback/history/${feedback}`)
      const response = await handleAppError(result)

      if (response.status === false) {
        if (response?.data) {
          history.value = response.data
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const reloadHistory = (feedback) => {
    reload.value = feedback
  }

  return {
    history,
    feedbackHistory,
    reloadHistory,
    reload,
  }
})
