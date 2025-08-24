import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import _ from 'lodash'
import { successNotify } from '@/utils/notification'
import feedbackCommentValidator from '@/validator/comment'
const { validateCreate } = feedbackCommentValidator()

export const feedbackCommentStore = defineStore('feedbackComment-store', () => {
  let errors = ref({})
  let comments = ref([])

  let skip = ref(0)
  const feedbackComments = async (feedbackSelect) => {
    try {
      const result = await fetchGet(`feedback/get/${feedbackSelect}/comments?${skip.value}`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          comments.value = response.data.data
          skip.value += comments.value.length
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const createComment = async (data) => {
    try {
      errors.value = {}
      const schemaProject = validateCreate()
      const data_result = await schemaProject.validate(data, { abortEarly: false })
      const form = new FormData()
      form.append('files', data.files)
      form.append('content', data_result.content)
      form.append('feedback_id', data_result.feedback_id)
      const result = await fetch(`feedback/comment/store`, {
        body: data_result,
      })
      const response = await handleAppError(result)
      if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      } else {
        if (response?.data) {
          comments.value.unshift(response.data.data)
          successNotify('Commentaire ajouté')
        }
      }
    } catch (err) {
      const result = handleCatchError(err)
      if (result) {
        errors.value = result
      }
    }
  }

  return {
    feedbackComments,
    comments,
    errors,
    createComment,
  }
})
