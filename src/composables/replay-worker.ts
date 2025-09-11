import { fetchPost } from '@/composables/request'
import { handleAppError } from '@/utils/handleAppError'

self.onmessage = async (e: MessageEvent) => {
  const { param, token, api } = e.data
  const chunk_limit = 10
  let chunk_skip = 0

  async function getChunksLoop() {
    while (true) {
      try {
        const result = await fetch(`${api}/session/show_with_chunks?skip=${chunk_skip}&limit=${chunk_limit}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
            Accept: 'application/json;charset=utf-8',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(param),
        })
        if (result.ok) {
          const response = await result.json()
          if (response?.data) {
            const events = response?.data?.events ?? []
            let session_data = null
            if (!session_data) {
              session_data = response?.data?.session
            }
            if (events.length === 0) {
              self.postMessage({ type: 'done' })
              break
            }
            chunk_skip += chunk_limit
            self.postMessage({ type: 'batch', events, session_data })
          }
        } else {
          self.postMessage({ type: 'error' })
          break
        }

        // self.postMessage({ type: 'error' });
      } catch (err) {
        self.postMessage({ type: 'error' })
        break
      }
    }
  }

  await getChunksLoop()
}
