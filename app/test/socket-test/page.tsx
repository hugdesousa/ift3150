// /socket-test/page.tsx
"use client";

import { useEffect } from "react";
import io from "socket.io-client";

export default function SocketTestPage() {
  useEffect(() => {
    // monte la connexion vers ton endpoint Socket.IO
    const socket = io("/", {
      path: "/api/socket_io",
      // si tu utilises https avec un sous‑chemin, adapte origin/hostname
    });

    socket.on("connect", () => {
      console.log("✅ Socket connecté, id =", socket.id);
      // remplace par un vrai id de conversation pour rejoindre sa room
      const testConvId = "330eb4ee-ad3a-4558-b3a5-398c50615766";
      console.log("📥 On rejoint la room", testConvId);
      socket.emit("joinRoom", testConvId);
    });

    socket.on("newMessage", (msg: any) => {
      console.log("💬 newMessage reçu :", msg);
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket déconnecté");
    });

    socket.on("error", (err) => {
      console.error("🚨 Erreur socket :", err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Socket.IO Test</h1>
      <p>
        Ouvre la console et envoie un message via <code>/api/chat/send</code>{" "}
        pour voir les événements arriver.
      </p>
    </div>
  );
}
