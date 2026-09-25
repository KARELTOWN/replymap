import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

// The home-made `notify` function, which built a box in the DOM, was no longer
// called anywhere: all its calls were commented out.
const options = {
  autoClose: 2000,
  position: 'top-right',
  hideProgressBar: true,
  transition: 'flip',
} as const

export const successNotify = (msg: string) => {
  toast.success(msg, options)

}

export const errorNotify = (msg: string) => {
  toast.error(msg, options)
}

export const infoNotify = (msg: string) => {
  toast.info(msg, options)
}

export const warningNotify = (msg: string) => {
  toast.warning(msg, options)
}

export const clearNotify = () => {
  toast.clearAll()
}
