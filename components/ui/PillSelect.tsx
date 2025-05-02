"use client";
import { useState } from "react";

export default function PillSelect({
  items,
  value,
  onChange,
  className = "",
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [active, setActive] = useState(value);
  return (
    <div className={`flex gap-2 overflow-auto ${className}`}>
      {items.map((it) => {
        const isSel = it === active;
        return (
          <button
            key={it}
            type="button"
            onClick={() => {
              setActive(it);
              onChange(it);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-1 text-sm transition
              ${
                isSel
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
