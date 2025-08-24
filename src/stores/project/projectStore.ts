import { fetchGet, fetchPost, fetchPut } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import projectValidator from '@/validator/project'
import { successNotify } from '@/utils/notification'
const { validateCreate, validateUpdate } = projectValidator()
export const projectStore = defineStore('project-store', () => {
  const errors = ref({})
  const search_errors = ref({})
  const projects = ref([])
  const tracking_code = ref('')
  const total = ref(0)
  const page = ref(1)
  const limit = ref(15)
  const totalPages = ref(0)
  const projectSuccess = ref(false)
  const search_form = reactive({
    search: '',
    start_date: '',
    end_date: '',
  })
  let selectProject = ref('')
  let openModal = ref(false)
  let openModalInvitation = ref(false)
  const projectMembers = ref([])

  const updatePagination = () => {
    total.value += 1
    totalPages.value = Math.ceil(total.value / limit.value)
  }

  const getProjects = async () => {
    try {
      const result = await fetchGet(`project/get?limit=${limit.value}&page=${page.value}`)
      const response = await handleAppError(result)
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
    }
  }

  const filterProjects = async (data) => {
    try {
      search_errors.value = {}
      const result = await fetchPost(`project/filter?limit=${limit.value}&page=${page.value}`, data)
      const response = await handleAppError(result)
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
    }
  }

  const createProject = async (data) => {
    try {
      projectSuccess.value = false
      tracking_code.value = ''
      errors.value = {}
      const schemaProject = validateCreate()
      const data_result = await schemaProject.validate(data, { abortEarly: false })
      const result = await fetchPost(`project/create`, data_result)
      const response = await handleAppError(result)
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

  const updateProject = async (data) => {
    try {
      projectSuccess.value = false
      errors.value = {}
      const schemaProject = validateUpdate()
      const data_result = await schemaProject.validate(data, { abortEarly: false })
      const result = await fetchPut(`project/update/${data_result.project_id}`, data_result)
      const response = await handleAppError(result)
      if (response.status === true) {
        if (response.errors) {
          errors.value = response.errors
        }
      } else {
        if (response?.data) {
          projectSuccess.value = true
          let project_index = projects.value.findIndex(
            (item) => item._id === data_result.project_id,
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

  const inviteUser = async (data) => {
    try {
      projectSuccess.value = false
      errors.value = {}
      const result = await fetchPost(`project/invite_user`, data)
      const response = await handleAppError(result)
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

  const getProjectMember = async (project_id) => {
    try {
      search_errors.value = {}
      const result = await fetchGet(`project/member/${project_id}`)
      const response = await handleAppError(result)
      if (response.status === false) {
        if (response?.data) {
          projectMembers.value = response.data
        }
      }
    } catch (err) {
      handleCatchError(err)
    }
  }

  const quitProject = async (data) => {
    try {
      projectSuccess.value = false
      search_errors.value = {}
      errors.value = {}
      const result = await fetchPost(`project/quit`, data)
      const response = await handleAppError(result)
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
    inviteUser,
    projectMembers,
    getProjectMember,
    quitProject,
  }
})
