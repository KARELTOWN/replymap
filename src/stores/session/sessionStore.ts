import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
export const sessionStore = defineStore('session-store', () => {
  const errors = ref({})
  const sessions = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(30)
  const totalPages = ref(0)
  const events = ref([])
  const session = ref({})
  const session_errors = ref([])
  const chunk_skip = ref(0)
  const chunk_limit = ref(5)
  const canGetChunk = ref(true)
  const search_errors = ref({})
  const search_form = reactive({
    project_id: '',
    start_date: '',
    end_date: '',
  })

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

  const filterSessions = async (data) => {
    try {
      search_errors.value = {}
      const result = await fetchPost(`session/filter?limit=${limit.value}&page=${page.value}`, data)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          sessions.value = response.data.sessions
          total.value = response.data.total
          page.value = response.data.page
          limit.value = response.data.limit
          totalPages.value = response.data.totalPages
        }
      } else {
        if (response.errors) {
          search_errors.value = response.errors
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const showSession = async (data) => {
    try {
      events.value = []
      const result = await fetchPost(
        `session/show?skip=${chunk_skip.value}&limit=${chunk_limit.value}`,
        data,
      )
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          if (Array.isArray(response.data.events) && response.data.events.length == 0) {
            canGetChunk.value = false
          } else if (Array.isArray(response.data.events) && response.data.events.length > 0) {
            canGetChunk.value = true
            chunk_skip.value += chunk_limit.value
            events.value = response.data.events
            if (!session.value?._id) {
              session.value = response.data.session
            }
          } else {
            canGetChunk.value = false
            errorNotify('Erreur de récupération de la session')
          }
        }
      } else {
        canGetChunk.value = false
      }
    } catch (err) {
      canGetChunk.value = false
      handleCatchError(err)
    }
  }

  const showErrors = async (data) => {
    try {
      session_errors.value = []
      const result = await fetchPut(`get_session_errors?limit=${limit.value}`, data)
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
    canGetChunk,
    chunk_skip,
    chunk_limit,
    filterSessions,
    search_form,
    search_errors
  }
})
