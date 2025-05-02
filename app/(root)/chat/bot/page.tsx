/* =========================================================================
   app/(root)/chat/bot/page.tsx — Chatbot HELPR
   ========================================================================= */
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/ui/Header";
import { Send } from "lucide-react";

/* ------------------------------------------------------------------
   Constantes UI (garder synchro avec <Header />)
------------------------------------------------------------------*/
const AVATAR_SIZE = 200;
const AVATAR_USER = "/icons/user-fill.svg";
const AVATAR_BOT = "/icons/bot-message.svg";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------*/
type Message = {
  role: "user" | "bot";
  text: string;
  type?: "greeting" | "emergency" | "problem" | "error" | "link";
  professional?: string;
};

/* ------------------------------------------------------------------
   Composant principal
------------------------------------------------------------------*/
export default function BotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") ?? "";
  const initialQuery = searchParams.get("query") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSent = useRef(false);

  /* ---------------- message de bienvenue ----------------------- */
  useEffect(() => {
    if (category) {
      setMessages([
        {
          role: "bot",
          text: `Vous cherchez un spécialiste en ${category.toLowerCase()} ? Décrivez votre problème.`,
          type: "greeting",
        },
      ]);
    }
  }, [category]);

  /* ---------------- fonction d’appel API ----------------------- */
  const askBot = useCallback(
    async (question: string) => {
      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", text: question }]);

      try {
        const res = await fetch("/api/ai/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: question, category }),
        });
        const data = await res.json();

        const botMsg: Message = {
          role: "bot",
          text: data.answer,
          type: data.type,
          professional: data.professional,
        };

        setMessages((prev) => {
          const next = [...prev, botMsg];

          /* Ajout systématique du lien “Voir les …” */
          if (botMsg.professional && botMsg.professional !== "none") {
            next.push({
              role: "bot",
              text:
                botMsg.professional === "Homme à tout faire"
                  ? "Voir les hommes à tout faire"
                  : `Voir les spécialistes en ${botMsg.professional}`,
              type: "link",
              professional: botMsg.professional,
            });
          }
          return next;
        });
      } finally {
        setLoading(false);
      }
    },
    [category],
  );

  /* ---------------- auto-envoi depuis la home ------------------ */
  useEffect(() => {
    if (!initialQuery || hasAutoSent.current) return;
    hasAutoSent.current = true;
    askBot(initialQuery);
    setInput("");
  }, [initialQuery, askBot]);

  /* ---------------- scroll auto ------------------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- submit manuel ----------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg.text, category }),
      });
      const data = await res.json();

      const botMsg: Message = {
        role: "bot",
        text: data.answer,
        type: data.type,
        professional: data.professional,
      };

      setMessages((prev) => {
        const seq = [...prev, botMsg];
        if (botMsg.professional && botMsg.professional !== "none") {
          seq.push({
            role: "bot",
            text:
              botMsg.professional === "Homme à tout faire"
                ? "Voir les hommes à tout faire"
                : `Voir les spécialistes en ${botMsg.professional}`,
            type: "link",
            professional: botMsg.professional,
          });
        }
        return seq;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Erreur de connexion", type: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  return (
    <div className="flex h-screen flex-col bg-[#e6f0fa]">
      {/* Header fixe */}
      <Header fixed transparent={false} />

      {/* Zone scrollable */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-md space-y-6 pb-6">
          {/* Avatar HELPR collé sous le header */}
          <div className="sticky top-[50px] z-10 flex justify-center bg-[#e6f0fa]">
            <Image
              src="/icons/bot-message.svg"
              alt="Bot HELPR"
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              priority
            />
          </div>

          {messages.length > 0 && <div className="pt-1" />}

          {/* messages */}
          {messages.map((m, i) => {
            /* Bouton “Voir les …” */
            if (m.type === "link" && m.professional) {
              const isHandy = m.professional === "Homme à tout faire";
              const label = isHandy
                ? "Voir les hommes à tout faire"
                : `Voir les spécialistes en ${m.professional}`;

              return (
                <div key={i} className="flex items-start gap-2 py-1">
                  {/* avatar casque */}
                  <div className="relative">
                    <Image
                      src="/icons/helmet-yellow.svg"
                      alt=""
                      width={40}
                      height={40}
                      className="relative rounded-full shadow"
                    />
                  </div>

                  {/* bulle clickable */}
                  <button
                    type="button"
                    role="link"
                    onClick={() =>
                      router.push(
                        `/search?q=${encodeURIComponent(m.professional)}`,
                      )
                    }
                    className={`
          group relative flex max-w-[75%] items-center gap-2
          rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-2
          text-sm font-medium text-blue-900 shadow
          transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400
          active:scale-95
        `}
                  >
                    <span className="whitespace-normal">{label}</span>
                  </button>
                </div>
              );
            }

            const isUser = m.role === "user";
            const avatar = isUser ? AVATAR_USER : AVATAR_BOT;
            const bubble = isUser
              ? "rounded-br-none bg-gradient-to-br from-blue-600 to-blue-500 text-white"
              : m.type === "emergency"
                ? "rounded-bl-none border border-red-200 bg-red-50 text-red-800"
                : "rounded-bl-none border border-gray-200 bg-white text-gray-900";

            return (
              <div
                key={i}
                className={`flex items-end gap-1 ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Image
                  src={avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="self-end rounded-full object-cover shadow"
                />
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-lg ${bubble}`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-1 pl-1 text-xl text-black">
              <Image
                src={AVATAR_BOT}
                alt=""
                width={40}
                height={40}
                className="self-end rounded-full object-cover pr-2 shadow"
              />
              <span className="animate-bounce">•</span>
              <span className="animate-bounce delay-75">•</span>
              <span className="animate-bounce delay-150">•</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Barre d'entrée */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+10px)]"
      >
        <div className="mx-auto flex max-w-md gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            placeholder={
              category
                ? `Problème de ${category.toLowerCase()}…`
                : "Décrivez votre problème…"
            }
            className="flex-1 rounded-xl border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-white shadow-lg transition hover:bg-blue-700 disabled:bg-blue-400"
          >
            <Send />
          </button>
        </div>
      </form>
    </div>
  );
}
