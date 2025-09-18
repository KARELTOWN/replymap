import { customFetch, fetchGet, fetchPost, getAppToken } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { errorNotify, successNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { reactive, ref, renderSlot } from 'vue'

export const integrationStore = defineStore('integration-store', () => {
  const integrationLogins:any = reactive({
    trello: '',
    slack: '',
    discord: '',
    assana: '',
    clickup: '',
  })

  const labels:any = ref([])
  const boards = ref([])

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
        }
      } else {
        if (response.status === 422) {
          if (res.errors.length > 0) {
            for (const element of res.errors) {
              if (
                element.path === 'project_id' &&
                (element.msg === 'expired' || element.msg === 'not_found')
              ) {
                reconnexion.value = true
                errorNotify("L'intégration a expiré. Veuillez la reconnecter")
                continue
              } else {
                errors.value[element.path] = element.msg
              }
            }
          }
        } else if (response.status == 403) {
          errorNotify(res.message)
        } else if (response.status == 404) {
          errorNotify(res.message)
        } else {
          errorNotify("Une erreur s'est produite")
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
    labels, createBoardLabel
  }
})
