"use client";
import { LocateFixed } from "lucide-react";
import { Filters } from "@/lib/utils/filters";

export function GeoFilter({
  filters,
  setFilters,
  requestLocation,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  requestLocation: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Utiliser ma position</span>
        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            className="size-4 accent-amber-600"
            checked={filters.useLocation}
            onChange={(e) =>
              setFilters((f) => ({ ...f, useLocation: e.target.checked }))
            }
          />
        </label>
      </div>

      {filters.useLocation && (
        <>
          <button
            type="button"
            onClick={requestLocation}
            className="mb-3 flex items-center gap-1 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-amber-700"
          >
            <LocateFixed className="size-4" />
            Géolocaliser
          </button>

          <div className="mb-3 text-sm">
            <label className="mr-2">Rayon (km) :</label>
            <input
              type="number"
              value={filters.radius}
              min={1}
              max={100}
              onChange={(e) =>
                setFilters((f) => ({ ...f, radius: Number(e.target.value) }))
              }
              className="w-20 rounded border px-1 py-0.5 text-right"
            />
          </div>
        </>
      )}
    </div>
  );
}
