/* ------------------------------------------------------------------
   ReviewTagPicker – petit sélecteur de “chips” cliquables
   ----------------------------------------------------------------- */
"use client";

import clsx from "clsx";

const TAGS = [
  "Ponctuel(le)",
  "Bonne communication",
  "Efficace",
  "Professionnel(le)",
  "Courtois(e)",
];

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
};

export default function ReviewTagPicker({ value, onChange }: Props) {
  function toggle(tag: string) {
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag],
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {TAGS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => toggle(t)}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs font-semibold transition",
            value.includes(t)
              ? "border-blue-800 bg-blue-800 text-white"
              : "border-blue-800 text-blue-800 hover:bg-blue-50",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
