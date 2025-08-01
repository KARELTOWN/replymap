import { fetchGet, fetchPost } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { ref } from 'vue'
export const sessionStore = defineStore('session-store', () => {
  const errors = ref({})
  const sessions = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(400)
  const totalPages = ref(0)

  const updatePagination = () => {
    total.value += 1
    totalPages.value = Math.ceil(total.value / limit.value)
  }

  const getSessions = async () => {
    try {
      const result = await fetchGet(`session/get?limit=${limit.value}&page=${page.value}`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          sessions.value = response.data.sessions
          console.log('sessions.value', sessions.value)
          total.value = response.data.total
          page.value = response.data.page
          limit.value = response.data.limit
          totalPages.value = response.data.totalPages
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const showSession = async (data) => {
    try {
      const result = await fetchPost('session/show', data)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          if (result && Array.isArray(response.data.events) && response.data.events.length >= 2) {
            return response.data
          } else {
            errorNotify('Erreur de récupération de la session')
          }
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }
  return {
    getSessions,
    errors,
    sessions,
    total,
    page,
    limit,
    totalPages,
    showSession,
  }
})
