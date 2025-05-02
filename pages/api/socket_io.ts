//ift3150/pages/api/socket_io.ts

import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as NetServer } from "http";
import { initSocket } from "@/lib/services/sockets/socket-server";

export const config = { api: { bodyParser: false } };

type ResWithServer = NextApiResponse & {
  // on ajoute explicitement la propriété `server`
  socket: NextApiResponse["socket"] & { server: NetServer };
};

export default function handler(_req: NextApiRequest, res: ResWithServer) {
  /* -----------------------------------------------------------------
     ❗ UN SEUL ENDPOINT PEUT CRÉER L’INSTANCE – on laisse initSocket()
     gérer le locking. Les autres requêtes n’ajoutent rien.
  ------------------------------------------------------------------ */
  initSocket(res.socket.server);
  console.log("socket_io.ts est appelé");
  // Pas de JSON, on confirme juste la dispo du WS
  res.status(200).end();
}
