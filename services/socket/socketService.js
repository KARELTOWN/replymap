import { io } from "socket.io-client";
import { configDotenv } from "dotenv";
import { envfile } from "../../index.js";

configDotenv({ path: envfile });

const socket = io(process.env.SOCKET_URL);

export default function socketService() {
  const listenEvent = (event) => {
    socket.on(event, (data) => {
      console.log("data", data);
    });
  };

  const emitEvent = (event, data) => {
    socket.emit(event, data);
  };

  return {
    listenEvent,
    emitEvent,
  };
}
