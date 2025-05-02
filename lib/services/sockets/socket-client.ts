//lib/socket-client.ts

import { io, Socket } from "socket.io-client";

declare global {
  // Survit aux hot‑reloads de Next.js
  // eslint-disable-next-line no-var
  var __HELPR_SOCKET__: Socket | undefined;
}

/** Retourne l’unique instance Socket.IO côté client. */
export function getSocket(): Socket {
  if (typeof window === "undefined") {
    // Placeholder neutre pendant le SSR
    // @ts-ignore
    return { connected: false, emit() {}, on() {}, off() {} };
  }

  if (!global.__HELPR_SOCKET__) {
    global.__HELPR_SOCKET__ = io({
      path: "/api/socket_io",
      transports: ["websocket"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });
  }
  return global.__HELPR_SOCKET__;
}
