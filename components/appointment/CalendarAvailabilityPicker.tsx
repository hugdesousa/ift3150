/* =========================================================================
   components/CalendarAvailabilityPicker.tsx
   ========================================================================= */
"use client";
import { useState, useEffect, useRef, Fragment } from "react";
import { Check } from "lucide-react";

export type Slot = { dayOfWeek: number; start: string; end: string };

const DAYS = ["L", "M", "M", "J", "V", "S", "D"]; // 7 colonnes
const BLOCKS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]; // 6 lignes

/* ---------- helpers --------------------------------------------------- */
const toMatrix = (slots: Slot[]) => {
  const m = Array.from({ length: BLOCKS.length }, () => Array(7).fill(false));
  slots.forEach(({ dayOfWeek, start }) => {
    const r = BLOCKS.indexOf(start);
    if (r === -1) return;
    const col = (dayOfWeek + 6) % 7; // 1→0 … 0→6
    m[r][col] = true;
  });
  return m;
};

const toSlots = (m: boolean[][]): Slot[] =>
  m.flatMap((row, r) =>
    row.flatMap((v, col) =>
      v
        ? [
            {
              dayOfWeek: (col + 1) % 7, // 0→1 … 6→0
              start: BLOCKS[r],
              end: BLOCKS[r + 1] ?? "20:00",
            },
          ]
        : [],
    ),
  );

/* ---------- component ------------------------------------------------- */
export default function CalendarAvailabilityPicker({
  initial = [],
  onChange,
}: {
  initial?: Slot[];
  onChange: (s: Slot[]) => void;
}) {
  const [matrix, setMatrix] = useState(() => toMatrix(initial));
  const first = useRef(true);

  /* – remonte dès qu’on modifie la matrice – */
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(toSlots(matrix));
  }, [matrix, onChange]);

  const toggle = (r: number, c: number) =>
    setMatrix((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = !next[r][c];
      return next;
    });

  /* ---------- UI ------------------------------------------------------ */
  return (
    <div className="select-none space-y-2 text-sm">
      {/* En-têtes jours */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)]">
        <div />
        {DAYS.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-t-md
                       bg-gray-100 py-2 font-semibold text-gray-700"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div
        className="grid gap-px rounded-md bg-gray-300
                   [grid-template-columns:80px_repeat(7,1fr)]"
      >
        {BLOCKS.map((time, r) => (
          <Fragment key={time}>
            {/* Libellé heure */}
            <div
              className="flex items-center justify-end bg-gray-50 pr-2
                         text-[11px] font-medium text-gray-500"
            >
              {time}
            </div>

            {/* 7 cellules */}
            {DAYS.map((_, c) => {
              const active = matrix[r][c];
              return (
                <button
                  key={c}
                  aria-pressed={active}
                  type="button"
                  onClick={() => toggle(r, c)}
                  className={`
                    relative aspect-square outline-none transition-colors
                    ${
                      active
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-white hover:bg-gray-50 active:bg-gray-100"
                    }
                    focus-visible:ring-2 focus-visible:ring-amber-400
                  `}
                >
                  {active && (
                    <Check
                      className="mx-auto size-4 animate-[pop_150ms_ease-out]"
                      strokeWidth={3}
                    />
                  )}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
