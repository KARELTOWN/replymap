import { fetchPost, clearSession } from '@/composables/request'
import { handleAppError } from '@/utils/handleAppError'
import { successNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const authStore = defineStore('auth', () => {
  const router = useRouter()

  // The API revokes every session of the account and clears the cookies. The
  // local session is cleared whatever happens, so the user does not stay
  // signed in if the call fails.
  const deconnect = async () => {
    try {
      const result = await fetchPost('auth/deconnect', {})
      await handleAppError(result)
    } catch (err) {
      console.error('Sign-out failed', err)
    } finally {
      clearSession()
      successNotify('Vous êtes déconnecté')
      router.push({ path: '/signin' })
    }
  }

  return {
    deconnect,
  }
})
