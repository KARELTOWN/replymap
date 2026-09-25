import { customFetch, fetchGet, fetchPost, getAppToken } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify, successNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { reactive, ref, renderSlot } from 'vue'

export const integrationStore = defineStore('integration-store', () => {
  // MVP: Trello is the only integration implemented end to end. The other keys
  // were empty placeholders, with no matching route or service in the API.
  const integrationLogins:any = reactive({
    trello: '',
  })

  const labels:any = ref([])
  const boards = ref([])
  const lists:any = ref([])

  const integrationsList = reactive([
    {
      libelle: 'TRELLO',
      id: 'trello',
    },
  ])

  const integrationSuccess = ref(false)

  const getIntegrationUrls = async (integration:any, project_id:any) => {
    try {
      const result = await fetchGet(`integration/login?name=${integration}&project=${project_id}`)
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false) {
        if (response?.data) {
          integrationLogins[integration] = response.data[integration]
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const storeToken = async (data:any) => {
    try {
      integrationSuccess.value = false
      const result = await fetchPost(`integration/store_token`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any }
      if (response.status === false) {
        if (response?.data) {
          integrationSuccess.value = true
          successNotify('Intégration réussie')
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const updateIntegration = async (data:any) => {
    try {
      integrationSuccess.value = false
      const result = await fetchPost(`integration/update`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          integrationSuccess.value = true
          successNotify('Modification réussie')
        }
      } else if (response.errors) {
        errors.value = response.errors
      }
    } catch (err) {
      handleCatchError(err)
    }
  }


  const getBoardLabels  = async (data:any) => {
    try {
      integrationSuccess.value = false
      const result = await fetchPost(`integration/get_board_labels`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          labels.value = response.data
        }
      } else if (response.errors) {
        errors.value = response.errors
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  // No notification here: the lists are also read when a feedback opens, where
  // "no board chosen yet" is an ordinary state, not an error to report.
  const getBoardLists = async (data:any) => {
    try {
      const result = await fetchPost(`integration/get_board_lists`, data)
      const body = await result.json().catch(() => ({}))
      lists.value = result.ok ? (body?.data ?? []) : []
      return result.ok ? null : (body?.error?.code ?? 'REQUEST_FAILED')
    } catch (err) {
      handleCatchError(err)
      lists.value = []
      return 'REQUEST_FAILED'
    }
  }


  const createBoardLabel = async (data:any) => {
    try {
      integrationSuccess.value = false
      errors.value = {}
      const result = await fetchPost(`integration/create_board_labels`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
                integrationSuccess.value = true
          labels.value.unshift(response.data)
        }
      } else if (response.errors) {
        errors.value = response.errors
      }
    } catch (err) {
      handleCatchError(err)
    }
  }


  const reconnexion = ref(false)
  const errors:any = ref({})
  const defaultBoard = ref(null)
  const statusMapping:any = ref([])

  const updateStatusMapping = async (data:any) => {
    try {
      errors.value = {}
      const result = await fetchPost(`integration/status_mapping`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          statusMapping.value = response.data
          successNotify('Correspondance mise à jour')
        }
      } else if (response.errors) {
        errors.value = response.errors
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const getBoards = async (data:any) => {
    try {
      errors.value = {}
      reconnexion.value = false
      const response = await customFetch(`integration/get_boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          Accept: 'application/json;charset=utf-8',
          Authorization: `Bearer ${getAppToken()}`,
        },
        body: JSON.stringify(data),
      })
      const res = await response
        .json()
        .catch((err) => console.log('Check integration result : IS NOT VALID JSON'))

      if (response.ok) {
        if (res.data) {
          boards.value = res.data.boards
          if(res.data?.default)
          {
            defaultBoard.value = res.data?.default
          }
          statusMapping.value = res.data?.status_mapping || []
        }
      } else {
        // The API names the reason with a stable code: an expired or missing
        // connection means the user has to authorise the tool again.
        const code = res?.error?.code
        if (code === 'INTEGRATION_EXPIRED' || code === 'INTEGRATION_NOT_CONNECTED') {
          reconnexion.value = true
          errorNotify(res.error.message)
        } else if (response.status === 422) {
          for (const detail of res?.error?.details ?? []) {
            if (detail?.field) errors.value[detail.field] = detail.message
          }
          errorNotify(res?.error?.message ?? "Une erreur s'est produite")
        } else {
          errorNotify(res?.error?.message ?? "Une erreur s'est produite")
        }
      }
    } catch (err:any) {
      console.log('err', err)
      throw new Error(err)
    }
  }

  return {
    getIntegrationUrls,
    integrationLogins,
    storeToken,
    integrationSuccess,
    integrationsList,
    boards,
    getBoards,
    errors,
    reconnexion,
    updateIntegration,
    defaultBoard,
    getBoardLabels,
    labels, createBoardLabel,
    getBoardLists,
    lists,
    statusMapping,
    updateStatusMapping,
  }
})
