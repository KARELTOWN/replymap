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
  // Tells a list still loading from a list that is really empty.
  const loading = ref(false)
  const search_form:any = reactive({
    project_id: '',
    account: '',
    start_date: '',
    end_date: '',
  })

  // People a session can be attributed to: the members who left feedback from
  // one. A visitor stays anonymous until then.
  const visitors:any = ref([])

  const getVisitors = async () => {
    try {
      const result = await fetchGet('session/visitors')
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false && Array.isArray(response.data)) {
        visitors.value = response.data
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const loggers:any = ref([])
  const player:any = ref(null)

  const updatePagination = () => {
    total.value += 1
    totalPages.value = Math.ceil(total.value / limit.value)
  }

  const getSessions = async () => {
    loading.value = true
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
    } finally {
      loading.value = false
    }
  }

  const filterSessions = async (data:any) => {
    loading.value = true
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
    } finally {
      loading.value = false
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

  // The path of the session: pages visited and forms sent, as a graph the
  // page animates. It is read on its own, because it is built from events and
  // not from the recording.
  const flow: any = ref(null)
  const flowLoading = ref(false)

  const getFlow = async (session_id: string) => {
    flow.value = null
    flowLoading.value = true
    try {
      const result = await fetchGet(`session/flow/${session_id}`)
      const response = (await handleAppError(result)) as { status: boolean; data?: any }
      if (response.status === false && response.data) flow.value = response.data
    } catch (err) {
      handleCatchError(err)
    } finally {
      flowLoading.value = false
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
    loading,
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
    visitors,
    getVisitors,
    canGetChunk,
    chunk_skip,
    chunk_limit,
    filterSessions,
    search_form,
    search_errors,
    errorMessage,
    session_errors_limit,
    player,
    loggers,
    flow,
    flowLoading,
    getFlow,
  }
})
