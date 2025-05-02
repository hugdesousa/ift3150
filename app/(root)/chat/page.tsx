/* =========================================================================
   /chat/page.tsx – liste mobile avec heading stylé
   ========================================================================= */
import { auth } from "@/auth";
import { ensureGuestSession } from "@/lib/validations/ensureGuestSession";
import { getConvPreviews } from "@/lib/db/getConvPreviews";
import ChatListWrapper from "@/components/chat/ChatListWrapper";

export default async function ChatListPage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  let guestId = session?.guestSession?.id ?? null;
  if (!userId && !guestId) guestId = await ensureGuestSession();

  const previews = await getConvPreviews({
    userId,
    guestId,
    role: session?.user?.role ?? null,
  });

  return (
    <div className="flex-1 overflow-hidden pt-5">
      {/* ---------- heading (z-safe) ---------- */}
      <div className="mb-4 flex justify-center">
        <span className="relative inline-flex items-center">
          {/* cercle derrière, MAIS z-index neutre */}
          <span className="absolute inset-0 rounded-full bg-blue-50 shadow-md" />
          <h1 className="relative px-5 py-1 text-lg font-medium text-black">
            Messagerie
          </h1>
        </span>
      </div>

      {/* -------- liste -------- */}
      <ChatListWrapper
        initialPreviews={previews}
        variant="mobile"
        className="p-4 pb-10"
      />
    </div>
  );
}
