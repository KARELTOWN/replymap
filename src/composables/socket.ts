import { io } from 'socket.io-client'
const socket = io(import.meta.env.VITE_SOCKET_URL)

export default function socketService() {
  const listenEvent = (event) => {
    socket.on(event, (data) => {
      console.log('data', data)
    })
  }
  const emitEvent = (event, data) => {
    socket.emit(event, data)
  }
  return {
    listenEvent,
    emitEvent,
  }
}
