/* MessageBubble.tsx – version corrigée
   ──────────────────────────────────── */
"use client";

import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ChatMessage } from "@/types";

/* util - concat classes */
const cls = (...c: (string | false | undefined)[]) =>
  c.filter(Boolean).join(" ");

export default function MessageBubble({
  message,
  isCurrentUser,
  avatarUrl,
}: {
  message: ChatMessage;
  isCurrentUser: boolean;
  avatarUrl: string;
}) {
  /* HH:mm */
  const time = format(new Date(message.created_at), "HH:mm", { locale: fr });

  /* styles bulle */
  const bubble = cls(
    "max-w-[75%] rounded-2xl px-4 py-2 text-sm  leading-relaxed shadow-lg",
    isCurrentUser
      ? "rounded-br-none bg-gradient-to-br from-blue-600 to-blue-500 text-white"
      : "rounded-bl-none border border-gray-200 bg-white text-gray-900",
  );

  /* ligne : avatar + bulle */
  const row = cls(
    "group flex items-start gap-2", // base
    isCurrentUser
      ? "flex-row-reverse text-right" // droite si courant
      : "flex-row text-left", // gauche sinon
  );

  return (
    <div className={row}>
      {/* avatar + heure (colonne) */}
      <div className="flex flex-col items-center leading-none">
        {/* avatar collé en bas → remonte avec l’heure */}
        <Image
          src={avatarUrl || "/icons/user-fill.svg"}
          alt=""
          width={40}
          height={40}
          className="rounded-full object-cover shadow-lg ring ring-white/80"
        />

        {/* heure cachée ➜ hover (desktop) OU tap/click (mobile) */}
        <span
          className={cls(
            "mt-1 text-[10px] text-gray-400 transition-opacity duration-200 shadow-lg",
            /* pour mobile on utilise :active, sur desktop :hover */
            "opacity-0 group-hover:opacity-100 group-active:opacity-100 shadow-lg",
          )}
        >
          {time}
        </span>
      </div>

      {/* bulle de texte */}
      <div className={bubble}>{message.content}</div>
    </div>
  );
}
