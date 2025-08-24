import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { successNotify } from '@/utils/notification'
import { feedbackHistoryStore } from './feedbackHistory'
const historyStore = feedbackHistoryStore()

export const feedbackStore = defineStore('feedback-store', () => {
  const project_id = ref('')
  const errors = ref({})
  const search_errors = ref({})
  const search_form = ref({
    type: '',
    priority: '',
    assignTo: '',
    status: '',
  })
  const feedbackDetailForm = ref({
    type: '',
    priority: '',
    assignTo: '',
    status: '',
  })
  const feedbacks = ref([])
  const feedbackStatus = ref([])
  const feedbackTypes = ref([])
  const feedbackPriority = ref([])

  const initialSkip = ref(0)

  const feedbackSelect = ref(null)
  const feedbackSelect_data = ref(null)
  const feedbackSelect_files = ref(null)

  const setFeedbackParams = () => {
    feedbackStatus.value = JSON.parse(localStorage.getItem('replaymap_feedbackStatus')) || []
    feedbackTypes.value = JSON.parse(localStorage.getItem('replaymap_feedbackTypes')) || []
    feedbackPriority.value = JSON.parse(localStorage.getItem('replaymap_feedbackPriority')) || []
    if (
      feedbackStatus.value.length === 0 ||
      feedbackTypes.value.length === 0 ||
      feedbackPriority.value.length === 0
    ) {
      return false
    } else {
      return true
    }
  }

  const feedbackParams = async () => {
    try {
      const isSet = setFeedbackParams()
      if (isSet === false) {
        const result = await fetchGet(`feedback/params`)
        const response = await handleAppError(result)
        if (response.status === false) {
          if (response?.data) {
            feedbackStatus.value = response.data.status
            feedbackTypes.value = response.data.type
            feedbackPriority.value = response.data.priority
          }
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const showFeedback = async () => {
    try {
      const result = await fetchGet(`feedback/get/${feedbackSelect.value}`)
      const response = await handleAppError(result)
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

  // récupérer les feedbacks d'un projets pour tous les status, ou pour charger plus de feedbacks pour un status spécifique

  const feedbackPerProject = async () => {
    try {
      let data = { project_id: project_id.value }
      search_errors.value = {}
      const result = await fetchPost(`feedback/project`, data)
      const response = await handleAppError(result)
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

  const updateFeedback = async (feedback, data, notify = true) => {
    try {
      //notify est false dans le cas ou on déplace un feedback dans un autre status par le glisser déposer
      search_errors.value = {}
      const result = await fetchPut(`feedback/update/${feedback}`, data)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (notify === true) {
          successNotify('Feedback mise à jour')
          historyStore.reloadHistory(feedback)
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

  const resetFeedbackSelectData = () => {
    feedbackDetailForm.value.priority = ''
    feedbackDetailForm.value.type = ''
    feedbackDetailForm.value.status = ''
    feedbackDetailForm.value.assignTo = ''
    feedbackSelect.value = null
    feedbackSelect_data.value = null
    feedbackSelect_files.value = null
  }


  return {
    feedbackPerProject,
    search_errors,
    search_form,
    feedbacks,
    project_id,
    errors,
    feedbackParams,
    showFeedback,
    updateFeedback,
    feedbackSelect_data,
    feedbackSelect_files,
    feedbackSelect,
    feedbackPriority,
    feedbackTypes,
    feedbackStatus,
    feedbackDetailForm,
    resetFeedbackSelectData
  }
})
