import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function initSocket(userId: string) {
  currentUserId = userId;
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socket.on("connect", () => {
      if (currentUserId) {
        socket!.emit("register", { userId: currentUserId });
      }
    });
  }
  // If already connected and userId changes, re-register
  if (socket.connected && userId !== currentUserId) {
    socket.emit("register", { userId });
  }
  return socket;
}

export function getSocket(userId?: string) {
  if (!socket) {
    if (!userId) throw new Error("Socket not initialized. Call initSocket(userId) first.");
    return initSocket(userId);
  }
  return socket;
}