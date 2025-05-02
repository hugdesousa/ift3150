/* ------------------------------------------------------------------
   lib/socket-server.ts
   ------------------------------------------------------------------ */
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

declare global {
  var __helpr_io: Server | undefined;
  var __helpr_io_lock: boolean | undefined;
}

/* ------------------------- helpers ------------------------------- */
export function getIO(): Server | null {
  return global.__helpr_io ?? null;
}

function waitForInstance(): Server {
  while (!global.__helpr_io) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  return global.__helpr_io!;
}

/* ------------------------- init --------------------------------- */
export function initSocket(http: HttpServer): Server {
  /* évite plusieurs instances en dev hot-reload ------------------ */
  if (global.__helpr_io) return global.__helpr_io;
  if (global.__helpr_io_lock) return waitForInstance();
  global.__helpr_io_lock = true;

  const io = new Server(http, {
    path: "/api/socket_io",
    transports: ["websocket", "polling"],
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  /* ========= namespace racine : messages texte ================= */
  io.on("connection", (s) => {
    console.log("🔌 connect", s.id);

    s.on("joinRoom", (r) => {
      console.log("📥", s.id, "join", r);
      s.join(r);
    });
    s.on("leaveRoom", (r) => s.leave(r));
  });

  /* ========= namespace /chat-events : RDV, reviews, etc. ======= */
  const chatNS = io.of("/chat-events");
  chatNS.on("connection", (s) => {
    console.log("📆 events connect", s.id);

    s.on("joinRoom", (r) => {
      console.log("📆 join", s.id, r);
      s.join(r);
    });
    s.on("leaveRoom", (r) => s.leave(r));
  });

  /* ========= namespace /notifications ========================= */
  io.of("/notifications").on("connection", (s) => {
    const { type, id } = s.handshake.auth as { type: string; id: string };
    if (!type || !id) return s.disconnect();

    s.join(`${type}:${id}`); // ex. "user:123e-…"
    console.log("🔔 notif connect", s.id, "=>", type, id);
  });

  /* (ignore warnings « double WebSocket upgrade ») -------------- */
  io.engine.on("connection_error", () => {});

  /* expose l’instance ------------------------------------------- */
  global.__helpr_io = io;
  global.__helpr_io_lock = false;
  return io;
}
