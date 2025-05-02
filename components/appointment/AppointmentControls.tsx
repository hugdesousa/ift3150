// ift3150/components/AppointmentControls.tsx

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { formatISO } from "date-fns";

import type { ChatEvent } from "@/types";

interface Props {
  convId: string;
  workerId: string; // 👈  requis par l’API
  onClose: () => void;
  onCreated: (e: ChatEvent) => void; // renvoi de l’event créé
}

export default function AppointmentControls({
  convId,
  workerId,
  onClose,
  onCreated,
}: Props) {
  /* ---------- mini‑state ------------------------------------- */
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [loading, setLoading] = useState(false);

  /* ---------- helpers ---------------------------------------- */
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 30 * 60_000);

  /* ---------- send ------------------------------------------- */
  async function handleSend() {
    setLoading(true);

    const resp = await fetch("/api/appointments/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: convId,
        workerId, // ✅  on l’envoie
        start: formatISO(start),
        end: formatISO(end),
      }),
    });

    setLoading(false);
    if (!resp.ok) {
      console.error("[request] HTTP", resp.status);
      return;
    }

    const ev = (await resp.json()) as ChatEvent; // ← l’API renvoie l’event
    onCreated(ev); // • ajoute dans le fil
    onClose(); // • ferme la modale
  }

  /* ---------- UI --------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[340px] rounded-xl bg-white p-6 shadow-lg">
        {/* header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Proposer un rendez‑vous</h3>
          <button onClick={onClose}>
            <X className="size-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* champs */}
        <label className="block text-sm font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-3 w-full rounded border px-3 py-2"
        />

        <label className="block text-sm font-medium">Heure</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mb-6 w-full rounded border px-3 py-2"
        />

        <button
          disabled={loading}
          onClick={handleSend}
          className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Envoi…" : "Envoyer la proposition"}
        </button>
      </div>
    </div>
  );
}
