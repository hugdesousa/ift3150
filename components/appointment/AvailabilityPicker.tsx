/* =========================================================================
   components/AvailabilityPicker.tsx
   ========================================================================= */
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type Slot = { day: number; start: string; end: string };

const DAYS = ["L", "M", "M", "J", "V", "S", "D"]; // 0–6

export default function AvailabilityPicker({
  initial = [],
  onChange,
}: {
  initial?: Slot[];
  onChange: (slots: Slot[]) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(initial);

  /* helpers */
  const update = (i: number, key: keyof Slot, val: any) => {
    const next = [...slots];
    next[i] = { ...next[i], [key]: val };
    setSlots(next);
    onChange(next);
  };

  const add = () => {
    const next = [...slots, { day: 0, start: "09:00", end: "17:00" }];
    setSlots(next);
    onChange(next);
  };

  const remove = (i: number) => {
    const next = slots.filter((_, idx) => idx !== i);
    setSlots(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {slots.map((s, i) => (
        <div
          key={i} /* ✔️ index = clé unique */
          className="flex items-center gap-3 rounded-lg p-3 ring-1 ring-gray-200"
        >
          {/* Badge jour */}
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-100 text-sm font-medium text-amber-800">
            {DAYS[s.day]}
          </span>

          {/* Sélecteurs */}
          <select
            value={s.day}
            onChange={(e) => update(i, "day", Number(e.target.value))}
            className="rounded border px-2 py-1 text-sm"
          >
            {DAYS.map((d, idx) => (
              <option key={idx} value={idx}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={s.start}
            onChange={(e) => update(i, "start", e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
          <span className="opacity-60">—</span>
          <input
            type="time"
            value={s.end}
            onChange={(e) => update(i, "end", e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />

          {/* Suppr */}
          <button
            type="button"
            onClick={() => remove(i)}
            className="ml-auto rounded bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700"
      >
        <Plus className="size-4" /> Ajouter un créneau
      </button>
    </div>
  );
}
