/* =========================================================================
   WorkerDetailClient – profil, calendrier, carrousel d’avis
   ========================================================================= */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, CalendarCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { parse } from "cookie";

import WorkerHero from "@/components/worker/WorkerHero";
import DayCalendar from "@/components/appointment/DayCalendar";
import ReviewCard from "@/components/review/ReviewCard";
import { Button } from "@/components/ui/button";

/* ---------- types ---------- */
type Slot = { dayOfWeek: number; start: string; end: string };
type Availability = { weekly: Slot[]; exceptions: string[] };
type Worker = {
  id: string;
  full_name: string;
  profile_image_url: string;
  description: string;
  skill: string;
  availability: Availability;
};
type Review = {
  id: string;
  rating: number;
  comment: string;
  author: string;
  since: string;
};

/* ----------------------------------------------------------------------- */
export default function WorkerDetailClient({
  worker,
  reviews,
}: {
  worker: Worker;
  reviews: Review[];
}) {
  const router = useRouter();
  const { data: session } = useSession();

  /* ── guest-session util ────────────────────────────────────────── */
  const getGuestSessionId = async () => {
    if (session?.user?.id) return null;
    const { guest_token } = parse(document.cookie || "");
    if (guest_token) return guest_token;
    const { id } = await (
      await fetch("/api/chat/guest-session", { method: "POST" })
    ).json();
    return id;
  };

  /* ── calendrier & slots ───────────────────────────────────────── */
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) {
      setSlots([]);
      setSlot(null);
      return;
    }

    const isoLocal = selected.toLocaleDateString("fr-CA");
    (async () => {
      const { slots: apiSlots = [] } = await (
        await fetch(`/api/workers/${worker.id}/availability?date=${isoLocal}`)
      ).json();
      setSlots(apiSlots as string[]);
      setSlot(null);
    })();
  }, [selected, worker.id]);

  /* ── jours disponibles (0=Lun … 6=Dim) ────────────────────────── */
  const availDays = Array.from(
    new Set(
      worker.availability.weekly
        .map((b: any) => Number(b.dayOfWeek ?? b.day)) // support des anciens enregistrements
        .filter((n) => !Number.isNaN(n))
        .map((n) => (n + 6) % 7), // 1→0, …, 0→6
    ),
  );

  /* ── actions ──────────────────────────────────────────────────── */
  async function handleStartConversation() {
    const userId = session?.user?.id ?? null;
    const guestSessionId = await getGuestSessionId();
    const { conversationId } = await (
      await fetch("/api/chat/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: worker.id, userId, guestSessionId }),
      })
    ).json();
    router.push(`/chat/${conversationId}`);
  }

  async function handleReserve() {
    if (!selected || !slot) return;
    const userId = session?.user?.id ?? null;
    const guestSessionId = await getGuestSessionId();

    const res = await fetch("../api/appointments/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerId: worker.id,
        date: selected.toLocaleDateString("fr-CA"),
        time: slot,
        userId,
        guestSessionId,
      }),
    });
    const { conversationId } = await res.json();
    router.push(`/chat/${conversationId}`);
  }

  /* ───────────────────────────────── render ────────────────────── */
  return (
    <div className="scrollbar-none flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50">
      {/* Header */}
      <header className="scrollbar-none sticky top-14  z-20 flex items-center justify-between rounded-b-xl bg-white/90 px-4 py-3 shadow backdrop-blur">
        <button onClick={() => router.back()} className="btnGhost">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-center text-base font-semibold text-blue-800">
          {worker.full_name}
          <span className="hidden lg:inline"> • {worker.skill}</span>
        </h1>
        <button onClick={handleStartConversation} className="btnGhost">
          <MessageSquare className="size-5" />
        </button>
      </header>

      {/* Wrapper */}
      <div className="scrollbar-none flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Profil (desktop) */}
        <aside className="hidden lg:block lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
          <WorkerHero
            className="mt-8 px-4"
            fullName={worker.full_name}
            avatar={worker.profile_image_url}
            skill={worker.skill}
            description={worker.description}
            availabilityDays={availDays}
          />
        </aside>

        {/* Contenu scrollable */}
        <main className="scrollbar-none flex flex-1 flex-col  items-center overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          {/* Hero mobile */}
          <div className="mb-6 lg:hidden">
            <WorkerHero
              fullName={worker.full_name}
              avatar={worker.profile_image_url}
              skill={worker.skill}
              description={worker.description}
              availabilityDays={availDays}
            />
          </div>

          <div className="w-full max-w-[900px]">
            {/* calendrier mensuel */}
            <DayCalendar
              month={month}
              availability={availDays}
              selected={selected}
              setMonth={setMonth}
              onSelect={setSelected}
            />

            {/* créneaux horaires */}
            {selected && (
              <section className="mt-6">
                <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl bg-white p-4 shadow">
                  <h3 className="text-center font-medium">
                    {selected.toLocaleDateString("fr-CA", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>

                  <div className="flex flex-wrap justify-center gap-2">
                    {slots.length ? (
                      slots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSlot(t)}
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            slot === t
                              ? "border-blue-800 bg-blue-800 text-white"
                              : "border-gray-200 bg-white hover:bg-blue-50"
                          }`}
                        >
                          {t}
                        </button>
                      ))
                    ) : (
                      <p className="w-full text-center text-gray-500">
                        Aucun créneau disponible
                      </p>
                    )}
                  </div>

                  {slot && (
                    <Button
                      onClick={handleReserve}
                      className="mt-2 w-full gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                    >
                      <CalendarCheck className="size-5" />
                      Réserver le {selected.toLocaleDateString("fr-CA")} à{" "}
                      {slot}
                    </Button>
                  )}
                </div>
              </section>
            )}

            {/* avis */}
            <section className="mt-8">
              <h2 className="rounded-t-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white">
                Avis ({reviews.length})
              </h2>
              <div className="scrollbar-thin scrollbar-thumb-blue-300 flex gap-4 overflow-x-auto rounded-b-xl bg-white px-4 py-5 shadow">
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    {...r}
                    className="w-[220px] shrink-0"
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
