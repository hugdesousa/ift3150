/* components/ui/GeoSelector.tsx */
"use client";
import { LocateFixed } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { geocodeCity } from "@/lib/utils/geocode";
import { toast } from "sonner";
import type { Geo } from "@/lib/utils/filters";

export function GeoSelector({
  cityInput,
  setCityInput,
  coords,
  setCoords,
  allowGps,
}: {
  cityInput: string;
  setCityInput: (v: string) => void;
  coords: Geo;
  setCoords: (g: Geo) => void;
  allowGps: boolean;
}) {
  const [loading, setLoading] = useState(false);

  /* auto–géocode 400 ms */
  useEffect(() => {
    const id = setTimeout(async () => {
      if (!cityInput.trim()) return;
      const g = await geocodeCity(cityInput);
      setCoords(g);
    }, 400);
    return () => clearTimeout(id);
  }, [cityInput]);

  /* GPS */
  const requestGPS = useCallback(() => {
    if (!allowGps) return;
    if (!navigator.geolocation) return toast.error("GPS non supporté");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        toast.success("Position enregistrée ✔︎");
        setLoading(false);
      },
      () => {
        toast.error("Impossible de récupérer la position");
        setLoading(false);
      },
    );
  }, [allowGps]);

  return (
    <div className="relative">
      <input
        type="text"
        value={cityInput}
        onChange={(e) => setCityInput(e.target.value)}
        placeholder="Entrez votre ville…"
        className="w-full rounded-md border px-3 py-2 pr-10 text-sm focus:border-amber-500 focus:outline-none"
      />
      {allowGps && (
        <button
          type="button"
          onClick={requestGPS}
          aria-label="Utiliser ma position"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600"
        >
          {loading ? (
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <LocateFixed className="size-4" />
          )}
        </button>
      )}
    </div>
  );
}
