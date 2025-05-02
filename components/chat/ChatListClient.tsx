/* -----------------------------------------------------------------------
   ChatListClient – mobile & sidebar previews
----------------------------------------------------------------------- */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

/* ---------- types --------------------------------------------------- */
export type ConvPreview = {
  id: string;
  participant: {
    id: string;
    type: "worker" | "user" | "guest";
    full_name: string;
    profile_image_url: string | null;
  };
  last_message: { content: string; created_at: string } | null;
  last_event: {
    kind: string;
    sender_id: string | null;
    created_at: string;
  } | null;
  unread_count: number;
};

type Props = {
  initialPreviews: ConvPreview[];
  variant: "mobile" | "sidebar";
  className?: string;
};

/* ---------- labels -------------------------------------------------- */
const evtLabel = (e: ConvPreview["last_event"]) =>
  e
    ? `📅 ${
        {
          appointment_requested: "Demande de RDV",
          appointment_confirmed: "RDV confirmé",
          appointment_cancelled: "RDV annulé",
          appointment_completed: "RDV complété",
        }[e.kind] ?? "RDV mis à jour"
      }`
    : "";

/* ==================================================================== */
export default function ChatListClient({
  initialPreviews,
  variant,
  className = "",
}: Props) {
  const [convs, setConvs] = useState(initialPreviews);
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
  const isMobile = variant === "mobile";

  /* websocket ------------------------------------------------------ */
  useEffect(() => {
    const s = io({ path: "/api/socket_io", transports: ["websocket"] });
    s.on("connect", () =>
      initialPreviews.forEach((c) => s.emit("joinRoom", c.id)),
    );
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [initialPreviews]);

  /* newMessage ----------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;
    const onNew = ({
      conversation_id,
      content,
      created_at,
    }: {
      conversation_id: string;
      content: string;
      created_at: string;
    }) =>
      setConvs((prev) => {
        let up: ConvPreview | null = null;
        const rest = prev.filter((c) => {
          if (c.id === conversation_id) {
            up = {
              ...c,
              last_message: { content, created_at },
              unread_count: c.unread_count + 1,
            };
            return false;
          }
          return true;
        });
        return up ? [up, ...rest] : prev;
      });
    socket.on("newMessage", onNew);
    return () => {
      socket.off("newMessage", onNew);
    };
  }, [socket]);

  /* mark-read helper ---------------------------------------------- */
  async function markRead(id: string) {
    await fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id }),
    });
    setConvs((p) =>
      p.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }

  if (!convs.length)
    return (
      <p className="grid h-full place-items-center text-gray-500">
        Aucune conversation.
      </p>
    );

  const profileUrl = (p: ConvPreview["participant"]) =>
    p.type === "worker" ? `/workers/${p.id}` : null;

  /* ========================== UI ================================= */
  return (
    <div
      className={
        isMobile
          ? `flex-1 space-y-4 overflow-y-auto ${className}`
          : "space-y-1 px-2"
      }
    >
      {convs.map((c) => {
        const unread = c.unread_count > 0;
        const lastLine =
          c.last_message?.content ??
          (evtLabel(c.last_event) || "Aucun message");
        const urlProfile = profileUrl(c.participant);

        /* ---------- CARD MOBILE -------------------------------- */
        if (isMobile)
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow transition active:scale-[0.97] ${
                unread ? "bg-blue-50" : "bg-white"
              }`}
            >
              {unread && (
                <span className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                  {c.unread_count > 9 ? "9+" : c.unread_count}
                </span>
              )}

              {/* avatar */}
              <Image
                src={c.participant.profile_image_url ?? "/icons/user-fill.svg"}
                alt={c.participant.full_name}
                width={52}
                height={52}
                className="rounded-full object-cover shadow-inner"
              />

              {/* texte */}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-none text-gray-900">
                  {c.participant.full_name}
                </p>
                <p className="mt-1 truncate text-sm text-gray-600">
                  {lastLine}
                </p>
              </div>

              {/* === actions TOP-right === */}
              <div className="absolute right-3 top-2 flex gap-3">
                {urlProfile && (
                  <button
                    title="Profil worker"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(urlProfile);
                    }}
                    className="rounded-full bg-white/80 p-2 shadow hover:bg-white active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4 text-gray-700"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
                    </svg>
                  </button>
                )}

                {unread && (
                  <button
                    title="Marquer lu"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markRead(c.id);
                    }}
                    className="rounded-full bg-white/80 p-2 shadow hover:bg-white active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4 text-green-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.285 6.709l-11.285 11.289-5.285-5.289 1.414-1.414 3.871 3.875 9.871-9.875z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* === timestamp BOTTOM-right === */}
              {c.last_message?.created_at && (
                <span className="absolute bottom-2 right-4 text-[10px] text-gray-400">
                  {dayjs(c.last_message.created_at).fromNow(true)}
                </span>
              )}
            </Link>
          );

        /* ---------- SIDEBAR PREVIEW --------------------------- */
        return (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={`group flex items-center gap-3 rounded-lg p-3 transition ${
              unread ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
            }`}
          >
            <Image
              src={c.participant.profile_image_url ?? "/icons/user-fill.svg"}
              alt={c.participant.full_name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-800">
                {c.participant.full_name}
              </p>
              <p className="truncate text-xs text-gray-500">{lastLine}</p>
            </div>

            <div className="ml-auto flex gap-2 opacity-0 transition group-hover:opacity-100">
              {urlProfile && (
                <button
                  title="Profil"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(urlProfile);
                  }}
                  className="rounded-full p-2 hover:bg-gray-100 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z" />
                  </svg>
                </button>
              )}

              {unread && (
                <button
                  title="Lu"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markRead(c.id);
                  }}
                  className="rounded-full p-2 hover:bg-gray-100 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.285 6.709l-11.285 11.289-5.285-5.289 1.414-1.414 3.871 3.875 9.871-9.875z" />
                  </svg>
                </button>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
