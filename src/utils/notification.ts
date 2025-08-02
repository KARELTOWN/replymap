import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

export const successNotify = (msg) => {
  toast.success(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
}

export const errorNotify = (msg) => {
  toast.error(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
}

export const infoNotify = (msg) => {
  toast.info(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
}

export const warningNotify = (msg) => {
  toast.warning(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
}

export const clearNotify = () => {
  toast.clearAll()
}
