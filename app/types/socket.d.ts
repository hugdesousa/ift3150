import type { Server as NetServer } from "http";
import type { Socket as NetSocket } from "net";
import type { Server, Namespace } from "socket.io";
import type { NextApiResponse } from "next";

/** Réponse Next.js avec accès à l’instance Socket.IO */
export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      /** instance racine `/` (chat existant)            */
      io?: Server;
      /** namespace `/notifications` (nouveau)           */
      ioNotif?: Namespace;
    };
  };
};
