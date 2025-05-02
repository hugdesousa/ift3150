/* -----------------------------------------------------------------------
   ChatListWrapper – simple proxy pour Next 15 (RSC ➜ client)
----------------------------------------------------------------------- */
"use client";

import dynamic from "next/dynamic";
import type { ConvPreview } from "./ChatListClient";

/* le vrai composant client */
const ChatListClient = dynamic(() => import("./ChatListClient"), {
  ssr: false,
});

export default function ChatListWrapper(props: {
  initialPreviews: ConvPreview[];
  variant: "mobile" | "sidebar";
  className?: string;
}) {
  return <ChatListClient {...props} />;
}
