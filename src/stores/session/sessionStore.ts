import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
export const sessionStore = defineStore('session-store', () => {
  const errors:any = ref({})
  const sessions:any = ref([])
  const total:any = ref(0)
  const page:any = ref(1)
  const limit:any = ref(15)
  const session_errors_limit:any = ref(15)
  const totalPages:any = ref(0)
  const events:any = ref([])
  const session:any = ref({})
  const session_errors:any = ref([])
  const chunk_skip:any = ref(0)
  const chunk_limit:any = ref(10)
  const canGetChunk:any = ref(true)
  const search_errors:any = ref({})
  const errorMessage:any = ref('')
  const search_form:any = reactive({
    project_id: '',
    start_date: '',
    end_date: '',
  })

  const loggers:any = ref([])
  const player:any = ref(null)

  const updatePagination = () => {
    total.value += 1
    totalPages.value = Math.ceil(total.value / limit.value)
  }

  const getSessions = async () => {
    try {
      const result = await fetchGet(`session/get?limit=${limit.value}&page=${page.value}`)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
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

  const filterSessions = async (data:any) => {
    try {
      search_errors.value = {}
      const result = await fetchPost(`session/filter?limit=${limit.value}&page=${page.value}`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
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

  const showSession = async (data:any) => {
    try {
      errorMessage.value = ''
      events.value = []
      const result = await fetchPost(
        `session/show_with_chunks?skip=${chunk_skip.value}&limit=${chunk_limit.value}`,
        data,
      )
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
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
        errorMessage.value = "Une erreur s'est produite"
      }
    } catch (err) {
      errorMessage.value = "Une erreur s'est produite"
      canGetChunk.value = false
      handleCatchError(err)
    }
  }

  const showErrors = async (data:any) => {
    try {
      data.is_error = false
      const result = await fetchPut(
        `event/filter?limit=${session_errors_limit.value}&page=${page.value}`,
        data,
      )
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          session_errors.value = response.data.events
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
    search_errors,
    errorMessage,
    session_errors_limit,
    player,
    loggers
  }
})
