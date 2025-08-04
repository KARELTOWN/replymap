import { fetchGet, fetchPost } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import projectValidator from '@/validator/project'
import { successNotify } from '@/utils/notification'
const { validateCreate } = projectValidator()
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
    end_date: ''
  })
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
      }
      else {
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

  return {
    createProject,
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
    search_form
  }
})
