/* =========================================================================
   MyAppointmentsClient – cartes RDV (✓ Confirmer · 🏁 Compléter)
   ========================================================================= */
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "../../hooks/use-toast";
import {
  Star,
  CalendarClock,
  CalendarCheck,
  Archive,
  MessageCircle,
  X,
  Check,
  Flag,
} from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import { appointments } from "@/database/schema";

/* ---------- types ---------------------------------------------------- */
export type Row = {
  conversationId: string | null;
  workerId: string;
  workerName: string | null;
  workerSkill: string | null;
  rate: number | null;
  avatar: string | null;
  rating: number | null;
  reviewId: string | null;
  start: Date | string;
  end: Date | string;
  initiator: "worker" | "user" | "guest" | null;
} & Pick<InferSelectModel<typeof appointments>, "id" | "status">;

/* ---------- helpers date -------------------------------------------- */
const toDate = (v: unknown) =>
  v instanceof Date ? v : v ? new Date(String(v)) : null;

const fmtDay = (v: unknown) =>
  toDate(v)?.toLocaleDateString("fr-CA", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  }) ?? "—";

const fmtHour = (v: unknown) =>
  toDate(v)?.toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "—";

/* ========================================================================= */
export default function MyAppointmentsClient({
  rows,
  isWorker,
}: {
  rows: Row[];
  isWorker: boolean;
}) {
  const router = useRouter();

  /* ---------- helpers fetch ------------------------------------ */
  async function mutate(url: string, body: unknown, okMsg: string) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (r.ok) {
      toast({ title: okMsg });
      router.refresh();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d’exécuter l’action",
        // ⬇︎ cast si ton type ne connaît pas encore `variant`
        variant: "destructive" as unknown as undefined,
      });
    }
  }

  const cancel = (id: string, c: string | null) =>
    mutate(
      "/api/appointments/cancel",
      { appointmentId: id, conversationId: c },
      "Rendez-vous annulé",
    );

  const archive = (id: string) =>
    mutate(
      "/api/appointments/archive",
      { appointmentId: id },
      "Rendez-vous archivé",
    );

  const accept = (id: string) =>
    mutate(
      "/api/appointments/accept",
      { appointmentId: id },
      "Rendez-vous confirmé",
    );

  const complete = (id: string) =>
    mutate(
      "/api/appointments/complete",
      { appointmentId: id },
      "Rendez-vous complété",
    );

  /* ---------- vide --------------------------------------------- */
  if (!rows.length)
    return (
      <p className="grid h-[calc(100vh-5rem)] place-items-center text-gray-500">
        Aucun&nbsp;RDV.
      </p>
    );

  /* ---------- palette ------------------------------------------ */
  const status = {
    REQUESTED: {
      bar: "bg-amber-400",
      chip: "bg-amber-100 text-amber-800",
      Icon: CalendarClock,
      label: "En attente",
    },
    CONFIRMED: {
      bar: "bg-green-500",
      chip: "bg-green-100 text-green-800",
      Icon: CalendarCheck,
      label: "Confirmé",
    },
    COMPLETED: {
      bar: "bg-gray-400",
      chip: "bg-gray-100  text-gray-800",
      Icon: CalendarCheck,
      label: "Terminé",
    },
    CANCELLED: {
      bar: "bg-red-500",
      chip: "bg-red-100   text-red-800",
      Icon: CalendarClock,
      label: "Annulé",
    },
    ARCHIVED: {
      bar: "bg-gray-300",
      chip: "bg-gray-100  text-gray-700",
      Icon: Archive,
      label: "Archivé",
    },
  } as const;

  /* ---------- render ------------------------------------------- */
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col overflow-hidden p-4">
      {/* heading « bulle » */}
      <div className="mb-4 flex justify-center">
        <span className="relative inline-flex items-center">
          <span className="absolute -z-10 h-8 w-full rounded-full bg-blue-50" />
          <h1 className="px-4 text-lg font-semibold text-blue-800">
            Mes&nbsp;rendez-vous
          </h1>
        </span>
      </div>

      {/* liste */}
      <ul className="flex-1 space-y-4 overflow-y-auto pr-1">
        {rows.map((apt) => {
          const { bar, chip, Icon, label } = status[apt.status ?? "REQUESTED"];

          /* ----- règles BTN ------------------------------------- */
          const who = (apt.initiator ?? "worker") as
            | "worker"
            | "user"
            | "guest";

          const canConfirm =
            apt.status === "REQUESTED" &&
            ((isWorker && who !== "worker") || (!isWorker && who === "worker"));

          const canComplete = isWorker && apt.status === "CONFIRMED";

          return (
            <li
              key={apt.id}
              className="relative flex gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-sm"
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />

              {/* avatar */}
              <Image
                src={apt.avatar ?? "/icons/user-fill.svg"}
                alt={apt.workerName ?? "Prestataire"}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />

              {/* contenu */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-none">
                      {apt.workerName ?? "—"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {apt.workerSkill ?? "—"}
                    </p>
                  </div>

                  {apt.rate && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-700">
                      {apt.rate}&nbsp;$
                    </span>
                  )}
                </div>

                <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                  <Icon className="size-4 shrink-0" />
                  {fmtDay(apt.start)} · {fmtHour(apt.start)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {apt.status !== "ARCHIVED" && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${chip}`}
                    >
                      {label}
                    </span>
                  )}

                  {!isWorker && !apt.reviewId && apt.status === "COMPLETED" && (
                    <Link
                      href={`/review/new?appointmentId=${apt.id}`}
                      className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 hover:bg-blue-200"
                    >
                      Laisser un avis
                    </Link>
                  )}

                  {!isWorker && apt.rating && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: apt.rating }).map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA bottom-right */}
              <div className="absolute bottom-3 right-4 flex gap-2">
                {apt.conversationId && (
                  <Link
                    href={`/chat/${apt.conversationId}`}
                    title="Discuter"
                    className="rounded-full bg-blue-600 p-2 text-white shadow-md transition hover:bg-blue-700 active:scale-95"
                  >
                    <MessageCircle className="size-4" />
                  </Link>
                )}

                {canConfirm && (
                  <button
                    title="Confirmer"
                    onClick={() => accept(apt.id)}
                    className="rounded-full bg-green-600 p-2 text-white shadow-md transition hover:bg-green-700 active:scale-95"
                  >
                    <Check className="size-4" />
                  </button>
                )}

                {canComplete && (
                  <button
                    title="Compléter"
                    onClick={() => complete(apt.id)}
                    className="rounded-full bg-indigo-600 p-2 text-white shadow-md transition hover:bg-indigo-700 active:scale-95"
                  >
                    <Flag className="size-4" />
                  </button>
                )}

                {["REQUESTED", "CONFIRMED"].includes(apt.status ?? "") && (
                  <button
                    title="Annuler"
                    onClick={() => cancel(apt.id, apt.conversationId)}
                    className="rounded-full bg-red-600 p-2 text-white shadow-md transition hover:bg-red-700 active:scale-95"
                  >
                    <X className="size-4" />
                  </button>
                )}

                {["COMPLETED", "CANCELLED"].includes(apt.status ?? "") && (
                  <button
                    title="Archiver"
                    onClick={() => archive(apt.id)}
                    className="rounded-full bg-gray-500 p-2 text-white shadow-md transition hover:bg-gray-600 active:scale-95"
                  >
                    <Archive className="size-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
