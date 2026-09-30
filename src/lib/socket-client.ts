"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let triedConnect = false;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

export function isSocketAvailable(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return !!SOCKET_URL;
}

export function getSocket(): Socket | null {
  if (!isSocketAvailable()) return null;
  if (!socket && !triedConnect) {
    triedConnect = true;
    if (SOCKET_URL) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
    } else {
      socket = io("/?XTransformPort=3003", {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
    }
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    triedConnect = false;
  }
}
