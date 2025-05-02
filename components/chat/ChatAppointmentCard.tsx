"use client";

import { ChatEvent } from "@/types/chat"; // ← le type qu’on a défini
import { useSession } from "next-auth/react";
import { Calendar, Clock, Check } from "lucide-react";

type AptEvent = Extract<ChatEvent, { kind: "appointment" }>;

export default function ChatAppointmentCard({ event }: { event: AptEvent }) {
  const { data: session } = useSession();
  const iAmWorker = session?.user?.role === "HELPR";

  /* ---------------- CONFIRM ---------------- */
  async function confirm() {
    const res = await fetch("/api/appointments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: event.appointmentId,
        conversationId: event.conversationId,
      }),
    });
    if (!res.ok) {
      // TODO: toast d’erreur
      console.error(await res.text());
    }
  }

  const fmtDate = new Date(event.start).toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const fmtStart = new Date(event.start).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fmtEnd = new Date(event.end).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-xs rounded-xl border bg-white p-4 shadow">
      <p className="mb-1 flex items-center gap-2 font-medium text-blue-700">
        <Calendar className="size-4" /> {fmtDate}
      </p>
      <p className="flex items-center gap-2 text-gray-800">
        <Clock className="size-4" /> {fmtStart} – {fmtEnd}
      </p>

      {event.status === "REQUESTED" && iAmWorker && (
        <button
          onClick={confirm}
          className="btnGhost mt-3 inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
        >
          <Check className="size-4" />
          Confirmer
        </button>
      )}

      {event.status === "CONFIRMED" && (
        <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-green-600">
          <Check className="size-4" /> Confirmé
        </p>
      )}
    </div>
  );
}
