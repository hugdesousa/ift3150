"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Flag } from "lucide-react";

interface Props {
  fullName: string;
  avatarUrl: string | null;
  workerId?: string;
}

export default function ChatHeader({ fullName, avatarUrl, workerId }: Props) {
  const profileHref = workerId ? `/workers/${workerId}` : "#";

  return (
    <header
      className="
        /* espace sous le nom */ /*
        petit écart avec le header
        HELPR                 */ sticky top-14 z-40 flex h-24
        flex-col                 items-center justify-center rounded-b-xl border-b bg-white py-2 shadow-sm
      "
    >
      {/* ← back */}
      <Link
        href="/chat"
        aria-label="Retour"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2
                   transition hover:bg-gray-100 active:scale-95"
      >
        <ArrowLeft className="size-6 text-blue-600" strokeWidth={2.2} />
      </Link>

      {/* flag */}
      {workerId && (
        <Link
          href={`/report?worker=${workerId}`}
          title="Signaler ce profil"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2
                     transition hover:bg-red-50 active:scale-95"
          style={{ zIndex: 20 }}
        >
          <Flag className="size-5 text-gray-400 hover:text-red-600" />
        </Link>
      )}

      {/* avatar + nom */}
      <Link href={profileHref} className="flex flex-col items-center gap-1">
        <Image
          src={avatarUrl || "/icons/user-fill.svg"}
          alt={fullName}
          width={48}
          height={48}
          className="rounded-full object-cover ring ring-white/80"
        />
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-500 px-3 py-0.5 text-sm font-medium text-white shadow-lg">
          {fullName}
        </span>
      </Link>
    </header>
  );
}
