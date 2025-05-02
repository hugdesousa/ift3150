// ift3150/components/AppointmentBubble.tsx

"use client";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import type { AppointmentPayload } from "@/types";

export default function AppointmentBubble({
  payload,
  isWorker,
}: {
  payload: AppointmentPayload;
  isWorker: boolean;
}) {
  const [sending, setSending] = useState(false);

  /* --- worker en mode « draft » -------------------------------- */
  if (isWorker && payload.status === "DRAFT") {
    return (
      <div className="rounded-lg border border-dashed bg-white p-4 text-sm">
        <p className="mb-2 flex items-center gap-1 font-semibold">
          <CalendarClock className="size-4" />
          Demande de rendez‑vous à envoyer
        </p>
        <p>
          {new Date(payload.start).toLocaleDateString("fr‑CA")} –{" "}
          {new Date(payload.start).toLocaleTimeString("fr‑CA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <button
          disabled={sending}
          onClick={async () => {
            setSending(true);
            await fetch("/api/appointments/send-request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          }}
          className="btnPrimary mt-2"
        >
          Envoyer la demande
        </button>
      </div>
    );
  }

  /* --- destinataire : bouton « Confirmer » --------------------- */
  if (!isWorker && payload.status === "REQUESTED") {
    return (
      <div className="rounded-lg border border-blue-400 bg-white p-4 text-sm">
        <p className="mb-2 flex items-center gap-1 font-semibold text-blue-800">
          <CalendarClock className="size-4" />
          Demande de rendez‑vous
        </p>
        <p>
          {new Date(payload.start).toLocaleDateString("fr‑CA")} –{" "}
          {new Date(payload.start).toLocaleTimeString("fr‑CA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <button
          disabled={sending}
          onClick={async () => {
            setSending(true);
            await fetch("/api/appointments/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appointmentId: payload.appointmentId }),
            });
          }}
          className="btnPrimary mt-2"
        >
          Confirmer
        </button>
      </div>
    );
  }

  /* --- confirmation (tout le monde, read‑only) ----------------- */
  if (payload.status === "CONFIRMED") {
    return (
      <div className="rounded-lg border border-green-400 bg-white p-4 text-sm">
        <p className="mb-1 font-semibold text-green-700">
          ✅ Rendez‑vous confirmé
        </p>
        <p>
          {new Date(payload.start).toLocaleDateString("fr‑CA")} –{" "}
          {new Date(payload.start).toLocaleTimeString("fr‑CA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }

  return null;
}
