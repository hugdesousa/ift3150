// hooks/use-guest-session.ts
"use client";

import { useEffect, useState } from "react";

export function useGuestSession() {
  const [guestSession, setGuestSession] = useState<{ id: string } | null>(null);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/chat/guest-session", { method: "POST" });
      if (!res.ok) {
        console.error("Erreur création guest-session", await res.text());
        return;
      }
      console.log("Nouveau guest");
      const sessionGuest = await res.json();
      setGuestSession({ id: sessionGuest.id });
    }
    init();
  }, []);

  return { guestSession };
}
