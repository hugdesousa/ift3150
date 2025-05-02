/* -----------------------------------------------------------------------
   components/chat/ChatClient – scroll-top load (≤10) + skip-autoscroll + dedupe
----------------------------------------------------------------------- */

"use client";

import React, {
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useSession } from "next-auth/react";
import { UnreadContext } from "@/components/UnreadContext";

import { useChatRoom } from "@/hooks/useChatRoom";
import ChatHeader from "@/components/chat/ChatHeader";
import SystemBanner from "@/components/chat/SystemBanner";
import MessageBubble from "@/components/chat/message-bubble";
import AppointmentCardMessage from "@/components/chat/AppointmentCardMessage";
import AppointmentControls from "@/components/appointment/AppointmentControls";
import { Send } from "lucide-react";

import type { ChatConversation, ChatEvent, ChatMessage } from "@/types";

/* helpers -------------------------------------------------------- */
const toDate = (d: unknown) => (d instanceof Date ? d : new Date(d as string));
const sortAsc = (a: { created_at: any }, b: { created_at: any }) =>
  toDate(a.created_at).getTime() - toDate(b.created_at).getTime();
const merge = (m: ChatMessage[], e: ChatEvent | null) =>
  [...m, ...(e ? [e] : [])].sort(sortAsc);
/** Renvoie l’URL d’avatar ou le fallback par défaut. */
const avatar = (p: unknown): string => {
  return p &&
    typeof p === "object" &&
    "profile_image_url" in p &&
    p.profile_image_url
    ? (p as { profile_image_url: string | null }).profile_image_url!
    : "/icons/user-fill.svg";
};

const upsert = (prev: ChatMessage[], incoming: ChatMessage[]) => {
  const map = new Map<string, ChatMessage>();
  [...prev, ...incoming].forEach((m) =>
    map.set(m.id, { ...m, created_at: toDate(m.created_at) }),
  );
  return Array.from(map.values()).sort(sortAsc);
};

/* ------------------------------------------------------------------ */
export default function ChatClient({
  conversation,
}: {
  conversation: ChatConversation & { events?: ChatEvent[] };
}) {
  const { data: session } = useSession();
  const isWorker = session?.user?.role === "HELPR";
  const convId = conversation.id;

  /* avatars */
  const other = isWorker
    ? (conversation.user ?? conversation.guestSession ?? null)
    : conversation.worker;
  const myAvatar = isWorker
    ? avatar(conversation.worker)
    : // ------------ côté client ------------
      session?.user?.image || // avatar NextAuth
      avatar(conversation.user) || // avatar DB (si user)
      "/icons/user-fill.svg"; // fallback invité
  const otherAvatar = isWorker ? avatar(other) : avatar(conversation.worker);
  const otherName = other?.full_name ?? "Invité";

  /* mark-read au montage */
  useEffect(() => {
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId }),
    }).catch(() => {});
  }, [convId]);

  useContext(UnreadContext);

  /* state messages / events */
  const [messages, setMessages] = useState<ChatMessage[]>(
    conversation.messages.map((m) => ({
      ...m,
      created_at: toDate(m.created_at),
    })),
  );
  const [lastEvent, setLastEvent] = useState<ChatEvent | null>(
    conversation.events?.at(-1) ?? null,
  );

  /* pagination */
  const [hasMore, setHasMore] = useState(messages.length === 10);
  const [loading, setLoading] = useState(false);

  /* input & modal */
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);

  /* refs & flags */
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const skipAuto = useRef(false);
  const topTimer = useRef<NodeJS.Timeout | null>(null);

  /* autoscroll – sauf après prepend */
  useEffect(() => {
    if (skipAuto.current) {
      skipAuto.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastEvent]);

  /* sockets ------------------------------------------------------- */
  useChatRoom(
    convId,
    (m) =>
      setMessages((p) =>
        upsert(p, [{ ...m, created_at: toDate(m.created_at) }]),
      ),
    (e) => {
      const p: any = e.payload ?? {};
      if (p.start) p.start = toDate(p.start);
      if (p.end) p.end = toDate(p.end);
      setLastEvent((pr) => (pr?.id === e.id ? pr : e));
    },
  );

  /* load anciens messages */
  const loadOlder = async () => {
    if (!hasMore || loading) return;
    setLoading(true);

    const list = listRef.current;
    const prevHeight = list?.scrollHeight ?? 0;
    const oldestId = messages[0]?.id;

    try {
      const r = await fetch(
        `/api/chat/history?conv=${convId}&before=${oldestId}`,
      );
      const older = (await r.json()) as ChatMessage[];

      if (older.length < 1) setHasMore(false);
      if (older.length) {
        skipAuto.current = true;
        setMessages((prev) => upsert(prev, older));

        requestAnimationFrame(() => {
          if (list) list.scrollTop = list.scrollHeight - prevHeight;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;

    if (el.scrollTop === 0) {
      if (!topTimer.current && hasMore && !loading) {
        topTimer.current = setTimeout(() => {
          topTimer.current = null;
          loadOlder();
        }, 600);
      }
    } else if (topTimer.current) {
      clearTimeout(topTimer.current);
      topTimer.current = null;
    }
  };

  /* timeline */
  const timeline = useMemo(
    () => merge(messages, lastEvent),
    [messages, lastEvent],
  );

  /* render item */
  const renderItem = (it: ChatMessage | ChatEvent) =>
    "content" in it ? (
      <MessageBubble
        key={`msg-${it.id}`}
        message={it}
        isCurrentUser={
          isWorker ? it.sender_type === "worker" : it.sender_type !== "worker"
        }
        avatarUrl={
          isWorker
            ? it.sender_type === "worker"
              ? myAvatar
              : otherAvatar
            : it.sender_type === "worker"
              ? otherAvatar
              : myAvatar
        }
      />
    ) : (
      <div
        key={`evt-${it.id}`}
        className={
          isWorker
            ? it.sender_id === conversation.worker.id
              ? "flex justify-end"
              : "flex justify-start"
            : it.sender_id === conversation.worker.id
              ? "flex justify-start"
              : "flex justify-end"
        }
      >
        <AppointmentCardMessage
          event={it}
          isMe={
            isWorker
              ? it.sender_id === conversation.worker.id
              : it.sender_id !== conversation.worker.id
          }
          isWorker={isWorker}
        />
      </div>
    );

  /* SEND */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const tmpId = "tmp-" + uuidv4();
    const optimistic: ChatMessage = {
      id: tmpId,
      content: text,
      created_at: new Date(),
      sender_type: isWorker ? "worker" : session?.user ? "user" : "guest",
      sender_id: session?.user?.id ?? null,
      guest_session_id: session?.guestSession?.id ?? null,
      receiver_id: isWorker
        ? (conversation.user?.id ?? conversation.guestSession?.id ?? null)
        : conversation.worker.id,
      status: "SENT",
      read_at: null,
    };

    setMessages((p) => upsert(p, [optimistic]));
    setInput("");

    try {
      const r = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, conversationId: convId }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const saved = (await r.json()) as ChatMessage;
      saved.created_at = toDate(saved.created_at);
      setMessages((p) =>
        upsert(
          p.filter((m) => m.id !== tmpId),
          [saved],
        ),
      );
    } catch {
      /* ignore */
    }
  };

  /* ----------------------------- JSX ----------------------------- */
  return (
    <div className="flex h-dvh flex-col bg-[#f5f9ff]  lg:pt-0">
      <ChatHeader
        fullName={otherName}
        avatarUrl={otherAvatar}
        workerId={!isWorker ? conversation.worker.id : undefined}
      />

      <SystemBanner event={lastEvent} />

      <div
        ref={listRef}
        onScroll={onScroll}
        className="scrollbar-none flex-1 overflow-y-auto bg-gray-50 px-4 pb-1 pt-20"
      >
        {loading && (
          <div className="flex justify-center py-4">
            <div className="size-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          </div>
        )}

        {/* sous-conteneur pour coller en bas */}
        <div className="flex min-h-full flex-col justify-end space-y-4">
          {timeline.map(renderItem)}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="
          sticky bottom-0 z-20 flex gap-2 border-t bg-white/90
          px-3 py-2 shadow-[0_-1px_6px_rgba(0,0,0,.05)] backdrop-blur
          lg:mb-4 lg:rounded-none
        "
      >
        {isWorker && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            title="Proposer un rendez-vous"
            className="rounded-lg border px-3 text-xl leading-none hover:bg-gray-50"
          >
            📅
          </button>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez un message…"
          className="
            flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
          "
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="
            flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-white
            shadow-lg transition hover:bg-blue-700 active:scale-95 disabled:opacity-50
          "
        >
          <Send className="size-5" />
        </button>
      </form>

      {showModal && isWorker && (
        <AppointmentControls
          convId={convId}
          workerId={conversation.worker.id}
          onClose={() => setShowModal(false)}
          onCreated={(ev) => setLastEvent(ev)}
        />
      )}
    </div>
  );
}
