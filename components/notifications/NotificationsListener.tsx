"use client";

import { io } from "socket.io-client";
import useSWR from "swr";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useGuestSession } from "@/hooks/use-guest-session";
import { UnreadContext } from "../UnreadContext";
import PrettyToast from "@/components/notifications/PrettyToast";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function NotificationsListener({
  children,
}: {
  children: React.ReactNode;
}) {
  /* -------- routing & auth ------------------------------------- */
  const pathname = usePathname() ?? "";
  const convId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : null;
  const router = useRouter();

  const { data: session } = useSession();
  const { guestSession } = useGuestSession();
  const auth =
    session?.user?.role === "HELPR"
      ? { type: "worker", id: session.user.id }
      : session?.user
        ? { type: "user", id: session.user.id }
        : guestSession
          ? { type: "guest", id: guestSession.id }
          : null;

  /* -------- badge (SWR) ---------------------------------------- */
  const { data, mutate } = useSWR<{ count: number }>(
    "/api/notifications/unread-count",
    fetcher,
  );
  const unread = data?.count ?? 0;

  /* -------- mark-read quand on ouvre un chat ------------------- */
  useEffect(() => {
    if (!convId) return;
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId }),
    })
      .then((r) => r.json())
      .then(({ cleared }: { cleared: number }) =>
        mutate(
          (p) => ({ count: Math.max(0, (p?.count ?? 0) - cleared) }),
          false,
        ),
      )
      .catch(() => {});
  }, [convId, mutate]);

  /* -------- Socket.IO ------------------------------------------ */
  useEffect(() => {
    if (!auth) return;
    const socket = io("/notifications", { path: "/api/socket_io", auth });

    /* ——— toast élégant ——— */
    socket.on("notification", (n) => {
      if (pathname.startsWith("/chat")) return; // jamais sur /chat/*

      toast.custom((t) => (
        <PrettyToast
          title={n.title}
          body={n.body}
          avatar={n.senderAvatar}
          onClick={() => {
            n.link && router.push(n.link);
            toast.dismiss(t);
          }}
          onClose={() => toast.dismiss(t)}
        />
      ));

      mutate((p) => ({ count: (p?.count ?? 0) + 1 }), false);
    });

    /* ——— incrément silencieux ——— */
    socket.on("unread:+1", ({ convId: id }: { convId: string | null }) => {
      if (id && pathname.startsWith("/chat") && pathname.endsWith(id)) return;
      mutate((p) => ({ count: (p?.count ?? 0) + 1 }), false);
    });

    socket.on("unread:reset", () => mutate({ count: 0 }, false));

    return () => {
      socket.disconnect(); // on appelle, puis on ne retourne rien
    };
  }, [auth, pathname, router, mutate]);

  return (
    <UnreadContext.Provider value={unread}>{children}</UnreadContext.Provider>
  );
}
