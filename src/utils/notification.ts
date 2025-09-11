import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

function notify(type, message) {
  const alert = document.createElement('div')
  alert.style.position = 'fixed'
  alert.className = 'custom-notification-' + type
  alert.style.top = '20px'
  alert.style.right = '20px'
  if (type === 'error') {
    alert.style.background = '#FF4646'
    alert.style.color = 'white'
  } else if (type === 'success') {
    alert.style.background = '#46FF7D'
    alert.style.color = 'black'
  } else if (type === 'info') {
    alert.style.background = '#46C8FF'
    alert.style.color = 'black'
  } else if (type === 'warning') {
    alert.style.background = '#f7a130ff'
    alert.style.color = 'black'
  }

  alert.style.padding = '15px 25px'
  alert.style.borderRadius = '8px'
  alert.style.boxShadow = '0 10px 15px rgba(0,0,0,0.2)'
  alert.style.zIndex = 999999999
  alert.innerText = message
  document.body.appendChild(alert)
  setTimeout(() => {
    if (document.body.contains(alert)) {
      document.body.removeChild(alert)
    }
  }, 3000)
}

export const successNotify = (msg) => {
  toast.success(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })

  // notify('success', msg)
}

export const errorNotify = (msg) => {
  toast.error(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
  // notify('error', msg)
}

export const infoNotify = (msg) => {
  toast.info(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
  // notify('info', msg)
}

export const warningNotify = (msg) => {
  toast.warning(msg, {
    autoClose: 2000,
    position: 'top-right',
    hideProgressBar: true,
    transition: 'flip',
  })
  // notify('warning', msg)
}

export const clearNotify = () => {
  toast.clearAll()
}
