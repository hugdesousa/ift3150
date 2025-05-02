"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/services/sockets/socket-client";

export default function NotificationsCenter() {
  const socket = getSocket();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (m: { conversation_id: string; content: string }) => {
      if (pathname.startsWith(`/chat/${m.conversation_id}`)) return;

      toast("Nouveau message", {
        description: m.content.slice(0, 80) || "…",
        action: {
          label: "Ouvrir",
          onClick: () => (window.location.href = `/chat/${m.conversation_id}`),
        },
      });
    };

    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
  }, [socket, pathname]);

  return null;
}
