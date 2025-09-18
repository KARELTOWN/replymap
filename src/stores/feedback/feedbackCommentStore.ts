import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
// import _ from 'lodash'
import { successNotify } from '@/utils/notification'
// import feedbackCommentValidator from '../../validator/'
// const { validateCreate } = feedbackCommentValidator()

export const feedbackCommentStore = defineStore('feedbackComment-store', () => {
  let errors = ref({})
  let comments = ref<Comment[]>([])

  let skip = ref(0)
  const feedbackComments = async (feedbackSelect: string) => {
    try {
      const result = await fetchGet(`feedback/get/${feedbackSelect}/comments?${skip.value}`)
      const response: { status?: boolean; data?: any } = await handleAppError(result)
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

  interface CreateCommentData {
    files: File | Blob;
    content: string;
    feedback_id: string;
    [key: string]: any;
  }

  interface Comment {
    // Define properties according to your comment structure
    [key: string]: any;
  }

  interface ResponseData {
    status?: boolean;
    data?: {
      data: Comment;
      [key: string]: any;
    };
    errors?: Record<string, any>;
  }

  const createComment = async (data: CreateCommentData): Promise<void> => {
    // try {
    //   errors.value = {}
    // const schemaProject = validateCreate()
    //   const data_result = await schemaProject.validate(data, { abortEarly: false })
    //   const form = new FormData()
    //   form.append('files', data.files)
    //   form.append('content', data_result.content)
    //   form.append('feedback_id', data_result.feedback_id)
    //   const result = await fetch(`feedback/comment/store`, {
    //     body: data_result,
    //   })
    //   const response: ResponseData = await handleAppError(result)
    //   if (response.status === true) {
    //     if (response.errors) {
    //       errors.value = response.errors
    //     }
    //   } else {
    //     if (response?.data) {
    //       comments.value.unshift(response.data.data)
    //       successNotify('Commentaire ajouté')
    //     }
    //   }
    // } catch (err) {
    //   const result = handleCatchError(err)
    //   if (result) {
    //     errors.value = result
    //   }
    // }
  }

  return {
    feedbackComments,
    comments,
    errors,
    createComment,
  }
})
