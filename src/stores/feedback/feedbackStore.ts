import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { fetchGet, fetchPost, fetchPut, fetchDestroy } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { successNotify } from '@/utils/notification'

// The history store was instantiated when the module loaded, outside any
// function: Pinia needs an active instance at that moment, so merely importing
// this file before Pinia was installed threw an error. It is now resolved when
// used.

export const feedbackStore = defineStore('feedback-store', () => {
  const project_id:any = ref('')
  const errors:any = ref({})
  const search_errors:any = ref({})
  // Type and status narrow what is already loaded; author and period are sent
  // to the API, which is the only place that sees every feedback of a project.
  const search_form:any = ref({
    type: '',
    status: '',
    author: '',
    start_date: '',
    end_date: '',
  })

  // Members who wrote on the selected project.
  const authors:any = ref([])

  const getAuthors = async () => {
    if (!project_id.value) return
    try {
      const result = await fetchPost('feedback/authors', { project_id: project_id.value })
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false && Array.isArray(response.data)) authors.value = response.data
    } catch (err) {
      handleCatchError(err)
    }
  }
  const feedbackDetailForm:any = ref({
    type: '',
    status: '',
  })
  const feedbacks:any = ref([])
  const feedbackStatus:any = ref([])
  const feedbackTypes:any = ref([])

  const initialSkip = ref(0)

  const feedbackSelect:any = ref(null)
  const feedbackSelect_data:any = ref(null)
  const feedbackSelect_files:any = ref(null)

  const setFeedbackParams = () => {
    const statusStr = localStorage.getItem('replaymap_feedbackStatus')
    const typesStr = localStorage.getItem('replaymap_feedbackTypes')
    feedbackStatus.value = statusStr !== null ? JSON.parse(statusStr) : []
    feedbackTypes.value = typesStr !== null ? JSON.parse(typesStr) : []
    if (feedbackStatus.value.length === 0 || feedbackTypes.value.length === 0) {
      return false
    } else {
      return true
    }
  }

  // Types and statuses are fixed reference data: the previous version read a
  // localStorage cache nobody wrote, so it called the API again every time the
  // modal opened. The answer is now really memoised.
  const feedbackParams = async () => {
    try {
      const isSet = setFeedbackParams()
      if (isSet === true) return

      const result = await fetchGet(`feedback/params`)
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false && response?.data) {
        feedbackStatus.value = response.data.status
        feedbackTypes.value = response.data.type
        localStorage.setItem('replaymap_feedbackStatus', JSON.stringify(response.data.status))
        localStorage.setItem('replaymap_feedbackTypes', JSON.stringify(response.data.type))
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const showFeedback = async () => {
    try {
      const result = await fetchGet(`feedback/get/${feedbackSelect.value}`)
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false) {
        if (response?.data) {
          feedbackSelect_data.value = response.data.feedback
          feedbackSelect_files.value = response.data.files
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  // Fetch a project's feedback for every status, or load more feedback for one status

  const feedbackPerProject = async () => {
    try {
      let data = {
        project_id: project_id.value,
        author: search_form.value.author,
        start_date: search_form.value.start_date,
        end_date: search_form.value.end_date,
      }
      search_errors.value = {}
      const result = await fetchPost(`feedback/project`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          feedbacks.value = response.data
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

  const updateFeedback = async (feedback:any, data:any, notify = true) => {
    try {
      // notify is false when a feedback is moved to another status by drag and drop
      search_errors.value = {}
      const result = await fetchPut(`feedback/update/${feedback}`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (notify === true) {
          successNotify('Feedback mise à jour')
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

  const sendFeedbackToIntegration = async (feedback:any, data:any) => {
    try {
      search_errors.value = {}
      const result = await fetchPost(`feedback/send_to_integration/${feedback}`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        successNotify('Feedback envoyé vers l\'intégration')
        await showFeedback()
      } else if (response.errors) {
        search_errors.value = response.errors
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const deleteFeedback = async (feedback: string) => {
    try {
      const result = await fetchDestroy(`feedback/delete/${feedback}`)
      const response = await handleAppError(result) as { status: boolean }
      if (response.status === false) {
        // The card leaves the board without reloading the whole view.
        for (const group of feedbacks.value || []) {
          const index = group.feedbacks.findIndex((item: any) => item._id === feedback)
          if (index !== -1) group.feedbacks.splice(index, 1)
        }
        resetFeedbackSelectData()
        successNotify('Feedback supprimé')
        return true
      }
      return false
    } catch (err) {
      handleCatchError(err)
      return false
    }
  }

  // Optimistic move of a card between two kanban columns: the `feedbacks`
  // array is the display source, it is reordered before the API answers so drag
  // and drop stays smooth.
  const moveFeedbackLocally = (feedbackId: string, fromStatusId: string, toStatusId: string) => {
    const groups = feedbacks.value || []
    const source = groups.find((group: any) => group.status?._id === fromStatusId)
    const target = groups.find((group: any) => group.status?._id === toStatusId)
    if (!source || !target) return

    const index = source.feedbacks.findIndex((item: any) => item._id === feedbackId)
    if (index === -1) return

    const [moved] = source.feedbacks.splice(index, 1)
    target.feedbacks.unshift(moved)
  }

  const resetFeedbackSelectData = () => {
    feedbackDetailForm.value.type = ''
    feedbackDetailForm.value.status = ''
    feedbackSelect.value = null
    feedbackSelect_data.value = null
    feedbackSelect_files.value = null
  }


  return {
    feedbackPerProject,
    authors,
    getAuthors,
    search_errors,
    search_form,
    feedbacks,
    project_id,
    errors,
    feedbackParams,
    showFeedback,
    updateFeedback,
    deleteFeedback,
    moveFeedbackLocally,
    sendFeedbackToIntegration,
    feedbackSelect_data,
    feedbackSelect_files,
    feedbackSelect,
    feedbackTypes,
    feedbackStatus,
    feedbackDetailForm,
    resetFeedbackSelectData
  }
})
