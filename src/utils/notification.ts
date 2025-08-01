import { useToast } from 'vue-toast-notification'
const $toast = useToast()

export const successNotify = (msg) => {
  $toast.success(msg, {
    position: 'top-right',
  })
}

export const errorNotify = (msg) => {
  $toast.error(msg, {
    position: 'top-right',
  })
}

export const infoNotify = (msg) => {
  $toast.info(msg, {
    position: 'top-right',
  })
}

export const warningNotify = (msg) => {
  $toast.warning(msg, {
    position: 'top-right',
  })
}

export const clearNotify = (msg) => {
  $toast.info(msg, {
    position: 'top-right',
  })
}