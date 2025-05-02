"use client";
import { X } from "lucide-react";
import { defaultFilters, Filters } from "@/lib/utils/filters";

export default function ActiveChips({
  filters,
  setFilters,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const chips = (
    [
      filters.minPrice > 0 && `≥ ${filters.minPrice} $`,
      filters.maxPrice < 1000 && `≤ ${filters.maxPrice} $`,
      filters.rating > 0 && `${filters.rating}★+`,
      filters.useLocation && `${filters.radius} km`,
    ] as (string | false)[]
  ).filter((c): c is string => Boolean(c));

  if (!chips.length) return null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c}
          className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
        >
          {c}
          <X
            className="size-4 cursor-pointer"
            onClick={() => setFilters(defaultFilters)}
          />
        </span>
      ))}
    </div>
  );
}
