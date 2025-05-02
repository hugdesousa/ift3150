//app/providers.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import NotificationsListener from "@/components/notifications/NotificationsListener";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  /* ping le WS au premier render */
  useEffect(() => {
    fetch("/api/socket_io").catch(() => {});
  }, []);

  return (
    <SessionProvider>
      <NotificationsListener>{children}</NotificationsListener>

      <Toaster position="top-right" toastOptions={{ className: "z-[9999]" }} />
    </SessionProvider>
  );
}
