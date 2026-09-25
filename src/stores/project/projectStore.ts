import { fetchGet, fetchPatch, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import projectValidator from '@/validator/project'
import { successNotify } from '@/utils/notification'
const { validateCreate, validateUpdate } = projectValidator()
export const projectStore = defineStore('project-store', () => {
  const errors = ref({})
  const search_errors:any = ref({})
  const projects:any = ref([])
  const tracking_code = ref('')
  const total = ref(0)
  const page = ref(1)
  const limit = ref(15)
  const totalPages = ref(0)
  const projectSuccess = ref(false)
  // Tells a list still loading from a list that is really empty.
  const loading = ref(false)
  const search_form = reactive({
    search: '',
    start_date: '',
    end_date: '',
  })
  let selectProject = ref('')
  let openModal = ref(false)
  let openModalInvitation = ref(false)
  const projectMembers = ref([])

  // Installation of the tracking script: what the project has received, and
  // what the check run against the website found. Both belong to the project
  // sheet, which is the only place they are read.
  const installation: any = ref(null)
  const installationLoading = ref(false)
  const installationTest: any = ref(null)
  const installationTesting = ref(false)

  const getInstallation = async (project_id: string) => {
    installation.value = null
    installationTest.value = null
    installationLoading.value = true
    try {
      const result = await fetchGet(`project/installation/${project_id}`)
      const response = (await handleAppError(result)) as { status: boolean; data?: any }
      if (response.status === false && response.data) installation.value = response.data
    } catch (err) {
      handleCatchError(err)
    } finally {
      installationLoading.value = false
    }
  }

  const testInstallation = async (project_id: string) => {
    installationTesting.value = true
    try {
      const result = await fetchPost(`project/installation/test/${project_id}`, {})
      const response = (await handleAppError(result)) as { status: boolean; data?: any }
      if (response.status === false && response.data) installationTest.value = response.data
    } catch (err) {
      handleCatchError(err)
    } finally {
      installationTesting.value = false
    }
  }

  // Switching one detected website off, or back on. The list is refreshed from
  // the API rather than patched locally: the server decides, and a refusal must
  // not leave the switch showing a state that was never applied.
  const hostUpdating = ref('')

  const setHostBlocked = async (project_id: string, host: string, blocked: boolean) => {
    hostUpdating.value = host
    try {
      const result = await fetchPatch(`project/installation/host/${project_id}`, { host, blocked })
      const response = (await handleAppError(result)) as { status: boolean; data?: any }
      if (response.status === false) {
        successNotify(blocked ? 'Site désactivé' : 'Site réactivé')
        await getInstallation(project_id)
      }
    } catch (err) {
      handleCatchError(err)
    } finally {
      hostUpdating.value = ''
    }
  }

  const updatePagination = () => {
    total.value += 1
    totalPages.value = Math.ceil(total.value / limit.value)
  }

  const getProjects = async () => {
    loading.value = true
    try {
      const result = await fetchGet(`project/get?limit=${limit.value}&page=${page.value}`)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          projects.value = response.data.projects
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

  const filterProjects = async (data:any) => {
    loading.value = true
    try {
      search_errors.value = {}
      const result = await fetchPost(`project/filter?limit=${limit.value}&page=${page.value}`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          projects.value = response.data.projects
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

  const createProject = async (data:any) => {
    try {
      projectSuccess.value = false
      tracking_code.value = ''
      errors.value = {}
      const schemaProject = validateCreate()
      const data_result = await schemaProject.validate(data, { abortEarly: false })
      const result = await fetchPost(`project/create`, data_result)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      } else {
        if (response?.data) {
          projectSuccess.value = true
          projects.value.unshift(response.data.project)
          tracking_code.value = response.data.project.tracking_code
          updatePagination()
          successNotify('Projet créé')
        }
      }
    } catch (err) {
      const result = handleCatchError(err)
      if (result) {
        errors.value = result
      }
    }
  }

  const updateProject = async (data:any) => {
    try {
      projectSuccess.value = false
      errors.value = {}
      const schemaProject = validateUpdate()
      const data_result = await schemaProject.validate(data, { abortEarly: false })
      const result = await fetchPut(`project/update/${data_result.project_id}`, data_result)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      } else {
        if (response?.data) {
          projectSuccess.value = true
          let project_index = projects.value.findIndex(
            (item:any) => item._id === data_result.project_id,
          )
          console.log('find index', project_index)
          projects.value[project_index] = response.data.project
          successNotify('Projet modifié')
        }
      }
    } catch (err) {
      const result = handleCatchError(err)
      if (result) {
        errors.value = result
      }
    }
  }

  const inviteUser = async (data:any) => {
    try {
      projectSuccess.value = false
      errors.value = {}
      const result = await fetchPost(`project/invite_user`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        projectSuccess.value = true
        successNotify('Utilisateur ajouté')
      } else if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const getProjectMember = async (project_id:any) => {
    try {
      search_errors.value = {}
      const result = await fetchGet(`project/member/${project_id}`)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        if (response?.data) {
          projectMembers.value = response.data
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const quitProject = async (data:any) => {
    try {
      projectSuccess.value = false
      search_errors.value = {}
      errors.value = {}
      const result = await fetchPost(`project/quit`, data)
      const response = await handleAppError(result) as { status: boolean; data?: any; errors: any }
      if (response.status === false) {
        projectSuccess.value = true
        successNotify('Modification réussie')
      } else if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  return {
    createProject,
    updateProject,
    getProjects,
    loading,
    errors,
    projects,
    tracking_code,
    total,
    page,
    limit,
    totalPages,
    projectSuccess,
    filterProjects,
    search_errors,
    search_form,
    selectProject,
    openModal,
    openModalInvitation,
    installation,
    installationLoading,
    installationTest,
    installationTesting,
    getInstallation,
    testInstallation,
    setHostBlocked,
    hostUpdating,
    inviteUser,
    projectMembers,
    getProjectMember,
    quitProject,
  }
})
