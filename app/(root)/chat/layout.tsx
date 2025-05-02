/* =========================================================================
   app/(root)/chat/layout.tsx Chat – sidebar (desktop) + outlet (main)
   ========================================================================= */

import React from "react";
import { auth } from "@/auth";
import { ensureGuestSession } from "@/lib/validations/ensureGuestSession";
import { getConvPreviews } from "@/lib/db/getConvPreviews";
import Header from "@/components/ui/Header";
import ChatListWrapper from "@/components/chat/ChatListWrapper";

export const dynamic = "force-dynamic";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* -- session --------------------------------------------------- */
  const session = await auth();
  const userId = session?.user?.id ?? null;
  let guestId = session?.guestSession?.id ?? null;

  if (!userId && !guestId) guestId = await ensureGuestSession();

  /* -- previews -------------------------------------------------- */
  const previews = await getConvPreviews({
    userId,
    guestId,
    role: session?.user?.role ?? null,
  });

  /* -- UI -------------------------------------------------------- */
  return (
    <div className="flex-1 overflow-hidden bg-white lg:grid lg:grid-cols-[18rem_1fr]">
      {/* ======= SIDEBAR DESKTOP (≥lg) =========================== */}
      <aside className="hidden flex-1 border-r bg-gray-50 lg:flex lg:flex-col">
        <h2 className="px-5 py-4 text-lg font-semibold text-blue-800">
          Conversations
        </h2>
        <ChatListWrapper initialPreviews={previews} variant="sidebar" />
      </aside>

      {/* ======= MAIN (liste mobile OU conversation) ============= */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
