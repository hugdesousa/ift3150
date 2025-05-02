"use client";

import { Clock, CalendarCheck, Star, X } from "lucide-react";
import type { ChatEvent } from "@/types";

export default function SystemBanner({ event }: { event: ChatEvent | null }) {
  if (!event) return null;

  const base =
    "sticky top-0 z-10 mx-auto mt-0 mb-4 w-fit rounded-lg border px-4 py-1.5 text-sm shadow backdrop-blur";

  const dateFmt = (d: Date) =>
    d.toLocaleDateString("fr-CA") +
    " à " +
    d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  switch (event.type) {
    case "appointment_cancelled":
      return (
        <div className={`${base} border-red-400`}>
          <p className="mb-0.5 flex items-center gap-1 font-semibold text-red-700">
            <X className="size-4" />
            Rendez‑vous annulé
          </p>
        </div>
      );

    case "appointment_requested": {
      const { start } = event.payload as any;
      return (
        <div className={`${base} border-blue-300 bg-white`}>
          <p className="flex items-center gap-1 font-medium text-blue-800">
            <Clock className="size-4" />
            Demande de rendez‑vous&nbsp;—&nbsp;{dateFmt(new Date(start))}
          </p>
        </div>
      );
    }

    case "appointment_confirmed": {
      const { start } = event.payload as any;
      return (
        <div className={`${base} border-green-400 bg-white`}>
          <p className="flex items-center gap-1 font-medium text-green-700">
            <CalendarCheck className="size-4" />
            Rendez‑vous confirmé&nbsp;—&nbsp;{dateFmt(new Date(start))}
          </p>
        </div>
      );
    }

    case "review_added": {
      const { rating } = event.payload as any;
      return (
        <div className={`${base} border-yellow-400 bg-white`}>
          <p className="flex items-center gap-1 font-medium text-yellow-700">
            <Star className="size-4" />
            Nouvel avis&nbsp;—&nbsp;{rating}/5
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}
