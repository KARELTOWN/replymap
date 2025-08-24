import { defineStore } from 'pinia'
import { saveAs } from 'file-saver'
import { errorNotify, infoNotify } from '@/utils/notification'

export const fileStore = defineStore('file-store', () => {
  const downloadFile = async (fileUrl, name) => {
    try {
      infoNotify('Téléchargement en cours')
      const response = await fetch(encodeURI(fileUrl))
      const blob = await response.blob()
      saveAs(blob, name)
      infoNotify('Téléchargement terminé')
    } catch (error) {
      console.error('Erreur de téléchargement', error)
      errorNotify('Erreur de téléchargement')
    }
  }
  return {
    downloadFile,
  }
})
