import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { successNotify } from '@/utils/notification'
export const eventStore = defineStore('event-store', () => {
  const errors = ref({})
  const search_errors = ref({})
  const events = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(15)
  const totalPages = ref(0)
  const eventSuccess = ref(false)
  const search_form = reactive({
    search: '',
    start_date: '',
    end_date: '',
    eventtype: '',
  })
  const eventtypes = ref([])

  const getEventTypes = async () => {
    try {
      const result = await fetchGet(`event/get-type`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          eventtypes.value = response.data
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const getEvents = async () => {
    try {
      const result = await fetchGet(`event/get?limit=${limit.value}&page=${page.value}`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          events.value = response.data.events
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

  const filterEvents = async () => {
    try {
      search_errors.value = {}
      const result = await fetchPut(
        `event/filter?limit=${limit.value}&page=${page.value}`,
        search_form,
      )
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          events.value = response.data.events
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

  return {
    getEvents,
    errors,
    events,
    total,
    page,
    limit,
    totalPages,
    eventSuccess,
    filterEvents,
    search_errors,
    search_form,
    getEventTypes,
    eventtypes,
  }
})
