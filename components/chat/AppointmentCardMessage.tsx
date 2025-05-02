/* =======================================================================
   components/AppointmentCardMessage.tsx
   – carte / bulle de rendez-vous dans le fil de chat
   ======================================================================= */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  CalendarCheck,
  CalendarX2,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import type {
  ChatEvent,
  AppointmentRequestedPayload,
  AppointmentConfirmedPayload,
  AppointmentCancelledPayload,
  AppointmentCompletedPayload,
} from "@/types";

type Status = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export default function AppointmentCardMessage({
  event,
  isMe, // « moi » = le client actuellement connecté
  isWorker, // true si le compte connecté est un worker
}: {
  event: ChatEvent;
  isMe: boolean;
  isWorker: boolean;
}) {
  /* ---------- payload & état initial ------------------------------- */
  const payload = event.payload as
    | AppointmentRequestedPayload
    | AppointmentConfirmedPayload
    | AppointmentCancelledPayload
    | AppointmentCompletedPayload;

  const initial: Status = (payload as any).status ?? "REQUESTED";
  const initiator = (payload as any).initiator as "worker" | "user" | "guest";

  // « je suis le destinataire » ↔ j’ai le bouton « Confirmer »
  const iAmReceiver =
    (isWorker && initiator !== "worker") ||
    (!isWorker && initiator === "worker");

  const [status, setStatus] = useState<Status>(initial);
  const [loading, setLoading] = useState<
    null | "confirm" | "complete" | "cancel"
  >(null);

  const start = new Date(payload.start);
  const dateLabel = `${start.toLocaleDateString("fr-CA")} – ${start.toLocaleTimeString(
    "fr-CA",
    { hour: "2-digit", minute: "2-digit" },
  )}`;

  /* ---------- helper fetch ---------------------------------------- */
  async function call(
    url: string,
    body: Record<string, unknown>,
    optimistic: Status,
    rollback: Status,
    tag: "confirm" | "complete" | "cancel",
  ) {
    setLoading(tag);
    setStatus(optimistic);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
    } catch {
      setStatus(rollback);
    } finally {
      setLoading(null);
    }
  }

  /* ---------- actions --------------------------------------------- */
  const handleConfirm = () =>
    call(
      "/api/appointments/accept",
      { appointmentId: payload.appointmentId },
      "CONFIRMED",
      "REQUESTED",
      "confirm",
    );

  const handleComplete = () =>
    call(
      "/api/appointments/complete",
      {
        appointmentId: payload.appointmentId,
        conversationId: event.conversation_id,
      },
      "COMPLETED",
      "CONFIRMED",
      "complete",
    );

  const handleCancel = () =>
    call(
      "/api/appointments/cancel",
      { appointmentId: payload.appointmentId },
      "CANCELLED",
      initial,
      "cancel",
    );

  /* ---------- styles dynamiques ----------------------------------- */
  const border =
    status === "REQUESTED"
      ? "border-blue-300"
      : status === "CONFIRMED"
        ? "border-green-400"
        : status === "COMPLETED"
          ? "border-emerald-400"
          : "border-red-400";

  const header =
    status === "REQUESTED"
      ? "text-blue-800"
      : status === "CONFIRMED"
        ? "text-green-700"
        : status === "COMPLETED"
          ? "text-emerald-700"
          : "text-red-700";

  /* ---------- rendu ------------------------------------------------ */
  return (
    <div
      className={`max-w-[70%] rounded-lg border ${border} bg-white p-4 text-sm shadow`}
    >
      {/* en-tête */}
      <p className={`mb-1 flex items-center gap-1 font-semibold ${header}`}>
        {status === "REQUESTED" && <Clock className="size-4" />}
        {status === "CONFIRMED" && <CalendarCheck className="size-4" />}
        {status === "COMPLETED" && <CheckCircle2 className="size-4" />}
        {status === "CANCELLED" && <CalendarX2 className="size-4" />}
        {status === "REQUESTED" && "Proposition de rendez-vous"}
        {status === "CONFIRMED" && "Rendez-vous confirmé"}
        {status === "COMPLETED" && "Rendez-vous terminé"}
        {status === "CANCELLED" && "Rendez-vous annulé"}
      </p>

      {/* date / heure */}
      <p>{dateLabel}</p>

      {/* --- boutons / libellés ------------------------------------- */}
      {status === "REQUESTED" &&
        (iAmReceiver ? (
          <button
            onClick={handleConfirm}
            disabled={loading === "confirm"}
            className="btnPrimary mt-2 w-full"
          >
            {loading === "confirm" ? (
              <Loader2 className="mx-auto size-4 animate-spin" />
            ) : (
              "Confirmer"
            )}
          </button>
        ) : (
          <p className="mt-2 text-center text-xs text-gray-500">
            En attente de confirmation…
          </p>
        ))}

      {status === "CONFIRMED" && isWorker && (
        <button
          onClick={handleComplete}
          disabled={loading === "complete"}
          className="mt-2 w-full rounded bg-emerald-600 py-1 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "complete" ? (
            <Loader2 className="mx-auto size-4 animate-spin" />
          ) : (
            "Marquer comme terminé"
          )}
        </button>
      )}

      {status !== "CANCELLED" && (
        <button
          onClick={handleCancel}
          disabled={loading === "cancel"}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-gray-300 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading === "cancel" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <>
              <Trash2 className="size-3" /> Annuler
            </>
          )}
        </button>
      )}

      {status === "CONFIRMED" && !isWorker && (
        <Link
          href="/my-appointments"
          className="mt-2 block text-center text-[11px] text-blue-600 underline"
        >
          Voir mes rendez-vous
        </Link>
      )}

      {status === "COMPLETED" && !isWorker && (
        <Link
          href={`/review/new?appointmentId=${payload.appointmentId}`}
          className="mt-2 block text-center text-[11px] text-amber-600 underline"
        >
          Laisser un avis
        </Link>
      )}
    </div>
  );
}
