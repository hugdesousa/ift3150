/* --------------------------------------------------------------------
   useChatRoom – hook React pour s’abonner à une conversation Socket.IO
   ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, ChatEvent } from "@/types";

/* sockets partagés (évite les reconnections multiples) */
let msgSock: Socket | null = null; // namespace racine
let evtSock: Socket | null = null; // namespace /chat-events

const SOCKET_PATH = "/api/socket_io";

export function useChatRoom(
  roomId: string,
  onMessage: (m: ChatMessage) => void,
  onEvent?: (e: ChatEvent) => void,
) {
  /* refs pour conserver les callbacks courants ------------------- */
  const msgRef = useRef(onMessage);
  const evtRef = useRef(onEvent);

  useEffect(() => {
    msgRef.current = onMessage;
  }, [onMessage]);
  useEffect(() => {
    evtRef.current = onEvent;
  }, [onEvent]);

  /* effet principal ---------------------------------------------- */
  useEffect(() => {
    /* ---------- namespace racine : messages & fallback events ---- */
    if (!msgSock)
      msgSock = io("/", { path: SOCKET_PATH, transports: ["websocket"] });

    msgSock.emit("joinRoom", roomId);

    const handleMsg = (m: ChatMessage) => msgRef.current?.(m);
    const handleEvt = (e: ChatEvent) => evtRef.current?.(e);

    msgSock.on("newMessage", handleMsg);
    msgSock.on("chatEvent", handleEvt); // v2
    msgSock.on("new-event", handleEvt); // compat v1

    /* ---------- namespace /chat-events : événements dédiés ------ */
    if (!evtSock)
      evtSock = io("/chat-events", {
        path: SOCKET_PATH,
        transports: ["websocket"],
      });

    evtSock.emit("joinRoom", `conv:${roomId}`);

    evtSock.on("chatEvent", handleEvt);
    evtSock.on("new-event", handleEvt);

    /* ---------- cleanup ----------------------------------------- */
    return () => {
      msgSock?.emit("leaveRoom", roomId);
      evtSock?.emit("leaveRoom", `conv:${roomId}`);

      msgSock?.off("newMessage", handleMsg);
      msgSock?.off("chatEvent", handleEvt);
      msgSock?.off("new-event", handleEvt);

      evtSock?.off("chatEvent", handleEvt);
      evtSock?.off("new-event", handleEvt);
    };
  }, [roomId]);
}
