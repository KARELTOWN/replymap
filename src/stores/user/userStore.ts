import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchGet, fetchPut, setSession, getSession } from '@/composables/request'
import { handleAppError, handleCatchError } from '@/utils/handleAppError'
import { successNotify } from '@/utils/notification'

// The signed-in account: what the profile page reads and changes.
export const userStore = defineStore('user-store', () => {
  const profile: any = ref(null)
  const errors: any = ref({})
  const loading = ref(false)
  const saving = ref(false)

  const getProfile = async () => {
    loading.value = true
    try {
      const result = await fetchGet('auth/profile')
      const response = (await handleAppError(result)) as { status: boolean; data?: any }
      if (response.status === false && response.data) profile.value = response.data
    } catch (err) {
      handleCatchError(err)
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (data: { firstname: string; lastname: string }) => {
    saving.value = true
    errors.value = {}
    try {
      const result = await fetchPut('auth/profile', data)
      const response = (await handleAppError(result)) as {
        status: boolean
        data?: any
        errors?: any
      }
      if (response.status === false) {
        if (response.data) profile.value = response.data
        successNotify('Profil mis à jour')
        return true
      }
      if (response.errors) errors.value = response.errors
      return false
    } catch (err) {
      handleCatchError(err)
      return false
    } finally {
      saving.value = false
    }
  }

  // The API closes every other session and hands back a fresh one, so this tab
  // keeps working while the others are signed out.
  const changePassword = async (data: {
    current_password: string
    password: string
    confirm_password: string
  }) => {
    saving.value = true
    errors.value = {}
    try {
      const result = await fetchPut('auth/password', data)
      const response = (await handleAppError(result)) as {
        status: boolean
        data?: any
        errors?: any
      }
      if (response.status === false) {
        if (response.data?.token) setSession({ ...getSession(), token: response.data.token })
        successNotify('Mot de passe modifié. Vos autres sessions ont été fermées.')
        return true
      }
      if (response.errors) errors.value = response.errors
      return false
    } catch (err) {
      handleCatchError(err)
      return false
    } finally {
      saving.value = false
    }
  }

  return { profile, errors, loading, saving, getProfile, updateProfile, changePassword }
})
