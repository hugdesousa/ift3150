/* components/ui/SelectablePills.tsx  */
"use client";
import { useState, useEffect } from "react";

export function SelectablePills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  /* referme si on clique ailleurs */
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="relative">
      {/* input “fake” */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        <span>{value || "Choisir une catégorie"}</span>
        <svg
          viewBox="0 0 16 16"
          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" fill="none" />
        </svg>
      </button>

      {/* liste déroulante */}
      {open && (
        <div
          className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md
                     border bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                opt === value ? "bg-amber-50 text-amber-700" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
