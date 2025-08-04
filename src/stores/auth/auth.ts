import { fetchGet } from '@/composables/request'
import { handleAppError } from '@/utils/handleAppError'
import { successNotify } from '@/utils/notification'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const authStore = defineStore('auth', () => {
  const router = useRouter()

  const deconnect = async () => {
    const result = await fetchGet('auth/deconnect')
    const response = await handleAppError(result)
    if (response.status === false) {
      localStorage.removeItem('replay_map_token')
      successNotify('Vous êtes déconnecté"')
      router.push({ path: '/signin' })
    }
  }
  return {
    deconnect,
  }
})
