import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { successNotify } from '@/utils/notification'
export const eventStore = defineStore('event-store', () => {
  const errors:any = ref({})
  const search_errors:any = ref({})
  const events:any = ref<any[]>([])
  const total:any = ref(0)
  const page:any = ref(1)
  const limit:any = ref(15)
  const totalPages:any = ref(0)
  const eventSuccess:any = ref(false)
  const search_form:any = reactive({
    search: '',
    start_date: '',
    end_date: '',
    eventtype: '',
  })
  const eventtypes:any = ref([])

  const getEventTypes = async () => {
    try {
      const result = await fetchGet(`event/get-type`)
      const response = await handleAppError(result) as { status: boolean; data?: any }
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
      const response = await handleAppError(result) as { status: boolean; data?: { events: any[]; total: number; page: number; limit: number; totalPages: number } }
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
      const response = await handleAppError(result) as { status: boolean; data?: { events: any[]; total: number; page: number; limit: number; totalPages: number }, errors?: any }
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
