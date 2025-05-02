/* ------------------------------------------------------------------------
   DayCalendar – petit calendrier mensuel avec pastilles de disponibilité
   --------------------------------------------------------------------- */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  month: Date;
  availability: number[]; // jours actifs 0-6 (dim-sam)
  selected: Date | null;
  setMonth: (d: Date) => void;
  onSelect: (d: Date) => void;
};

export default function DayCalendar({
  month,
  availability,
  selected,
  setMonth,
  onSelect,
}: Props) {
  /* helpers --------------------------------------------------------- */
  const DAYS = ["D", "L", "M", "M", "J", "V", "S"];

  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(y, m, i + 1),
  );

  /* render ---------------------------------------------------------- */
  return (
    <div className="mx-auto w-full max-w-xl rounded-xl bg-white p-4 shadow">
      {/* barre mois */}
      <div className="mb-4 flex items-center justify-between text-gray-700">
        <ChevronLeft
          onClick={() => setMonth(new Date(y, m - 1, 1))}
          className="size-5 cursor-pointer hover:text-blue-800"
        />
        <h3 className="text-sm font-semibold capitalize">
          {month.toLocaleDateString("fr-CA", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <ChevronRight
          onClick={() => setMonth(new Date(y, m + 1, 1))}
          className="size-5 cursor-pointer hover:text-blue-800"
        />
      </div>

      {/* entêtes */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500">
        {DAYS.map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>

      {/* jours */}
      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {/* padding début de mois */}
        {Array(startPad)
          .fill(null)
          .map((_, i) => (
            <div key={`pad-${i}`} className="h-10" />
          ))}

        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const active = availability.includes(day.getDay());
          const isSel = selected?.toDateString() === day.toDateString();

          return (
            <button
              key={key}
              disabled={!active}
              onClick={() => onSelect(day)}
              className={`relative flex h-10 w-full items-center justify-center rounded-full text-sm font-medium
                ${
                  isSel
                    ? "bg-blue-800 text-white"
                    : active
                      ? "text-gray-800 hover:bg-blue-100"
                      : "cursor-not-allowed text-gray-400/60"
                }`}
            >
              {day.getDate()}
              {/* pastille dispo */}
              <span
                className={`absolute -bottom-0.5 size-1.5 rounded-full ${
                  active ? "bg-green-500" : "bg-red-400/60"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
