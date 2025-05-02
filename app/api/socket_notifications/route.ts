// app/api/socket_notifications/route.ts
import type { NextApiRequest } from "next";
import { Server } from "socket.io";
import type { NextApiResponseServerIO } from "@/types/socket"; // ← utilise le helper

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  /* Init unique */
  if (!res.socket.server.ioNotif) {
    res.socket.server.ioNotif = new Server(res.socket.server, {
      path: "/api/socket_io",
      addTrailingSlash: false,
    }).of("/notifications");

    res.socket.server.ioNotif.on("connection", (socket) => {
      const { type, id } = socket.handshake.auth as {
        type?: "user" | "worker" | "guest";
        id?: string;
      };
      if (type && id) socket.join(`${type}:${id}`);
    });
  }

  res.status(200).end();
}
