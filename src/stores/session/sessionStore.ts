import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { ref } from 'vue'
export const sessionStore = defineStore('session-store', () => {
  const errors = ref({})
  const sessions = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(560)
  const totalPages = ref(0)
  const events = ref([])
  const session = ref({})
  const session_errors = ref([])

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
      session.value = []
      events.value = []
      const result = await fetchPost('session/show', data)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          if (
            result &&
            Array.isArray(response.data.events) &&
            response.data.events.length >= 2 &&
            response.data.session
          ) {
            events.value = response.data.events
            session.value = response.data.session
          } else {
            errorNotify('Erreur de récupération de la session')
          }
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const showErrors = async (data) => {
    try {
      session_errors.value = []
      const result = await fetchPut(`get_intercept_errors?limit=${limit.value}`, data)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          session_errors.value = response.data
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
    events,
    session,
    session_errors,
    showErrors,
  }
})
