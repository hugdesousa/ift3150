// // app/_socket/SocketProvider.tsx
// "use client";
//
// import { createContext, useContext, useEffect, useState } from "react";
// import { io, Socket } from "socket.io-client";
// import { useSession } from "next-auth/react";
// import { useConvStore } from "@/lib/stores/conversations"; // Zustand
//
// type Ctx = { socket: Socket | null };
// const SocketCtx = createContext<Ctx>({ socket: null });
//
// export const useGlobalSocket = () => useContext(SocketCtx);
//
// export default function SocketProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { data: session, status } = useSession(); // NextAuth
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const { addOrUpdatePreview } = useConvStore(); // Zustand actions
//
//   // 1. Ouverture unique
//   useEffect(() => {
//     if (status !== "authenticated" && !document.cookie.includes("guest_token"))
//       return;
//
//     // on s’assure que le handler Next.js lève bien le serveur socket
//     fetch("/api/socket_io");
//
//     const s = io(undefined, { transports: ["websocket"] }); // même domaine
//     setSocket(s);
//
//     return () => {
//       s.close();
//     };
//   }, [status]);
//
//   // 2. Join des rooms après auth/guest ready
//   useEffect(() => {
//     if (!socket) return;
//
//     socket.emit("join_global_rooms"); // le serveur détecte user/worker/guest via cookies+session
//   }, [socket, status]);
//
//   // 3. Réception des events
//   useEffect(() => {
//     if (!socket) return;
//
//     const onNewMsg = (payload: any) => {
//       addOrUpdatePreview(payload); // maj store (unread_count, last_message…)
//     };
//
//     socket.on("newMessage", onNewMsg);
//     socket.on("appointment_event", onNewMsg); // si vous voulez les RDV aussi
//
//     return () => {
//       socket.off("newMessage", onNewMsg);
//       socket.off("appointment_event", onNewMsg);
//     };
//   }, [socket]);
//
//   return <SocketCtx.Provider value={{ socket }}>{children}</SocketCtx.Provider>;
// }
