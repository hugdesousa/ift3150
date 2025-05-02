/* =========================================================================
   components/FancyAvailabilityPicker.tsx
   ========================================================================= */
"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";

export type Slot = { day: number; start: string; end: string };
const days = ["L", "M", "M", "J", "V", "S", "D"];

export default function FancyAvailabilityPicker({
  initial = [],
  onChange,
}: {
  initial?: Slot[];
  onChange: (s: Slot[]) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(initial);

  const addSlot = (day: number) => {
    const next = [...slots, { day, start: "09:00", end: "17:00" }];
    setSlots(next);
    onChange(next);
  };

  const update = (idx: number, key: keyof Slot, val: any) => {
    const next = [...slots];
    next[idx] = { ...next[idx], [key]: val };
    setSlots(next);
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = slots.filter((_, i) => i !== idx);
    setSlots(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, dayIdx) => {
          const daySlots = slots.filter((s) => s.day === dayIdx);
          return (
            <div key={d} className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {d}
              </div>

              {daySlots.map((slot, i) => {
                const globalIdx = slots.findIndex(
                  (s) =>
                    s.day === slot.day &&
                    s.start === slot.start &&
                    s.end === slot.end,
                );
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs text-sky-800"
                  >
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        update(globalIdx, "start", e.target.value)
                      }
                      className="border-none bg-transparent outline-none"
                    />
                    <span>—</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => update(globalIdx, "end", e.target.value)}
                      className="border-none bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => remove(globalIdx)}
                      className="ml-1 text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => addSlot(dayIdx)}
                className="rounded-full bg-amber-600 p-1 text-white hover:bg-amber-700"
              >
                <Plus className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
