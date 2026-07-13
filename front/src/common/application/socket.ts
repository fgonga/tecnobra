// src/socket.ts
import { io, Socket } from "socket.io-client";
const socket: Socket = io(import.meta.env.VITE_SOCKET_URL, {
  transports: ["websocket"]
});
console.log("Socket URL:", import.meta.env.VITE_SOCKET_URL);
console.log("Socket Object:", socket);
socket.on("error", () => {
  console.log("error")
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

export { socket };
