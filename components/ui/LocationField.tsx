/* =========================================================================
   components/LocationField.tsx
   ========================================================================= */
"use client";
import { LocateFixed } from "lucide-react";
import { useState } from "react";

type Props = {
  value?: string;
  onResolved: (label: string, lat: number, lng: number) => void;
};

export default function LocationField({ value = "", onResolved }: Props) {
  const [loc, setLoc] = useState(value);
  const [loading, setLoading] = useState(false);

  const geocode = async (lat: number, lng: number) => {
    // 👉 Replace with your own Mapbox/Google endpoint
    const r = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    const { label } = await r.json();
    setLoc(label);
    onResolved(label, lat, lng);
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        geocode(latitude, longitude).finally(() => setLoading(false));
      },
      () => setLoading(false),
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="relative flex items-center">
      <input
        value={loc}
        onChange={(e) => setLoc(e.target.value)}
        placeholder="Ex : Montréal, QC"
        className="w-full rounded border p-2 pr-10"
      />
      <button
        type="button"
        onClick={locateMe}
        className="absolute right-2 text-gray-500 hover:text-gray-700"
      >
        {loading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <LocateFixed className="size-5" />
        )}
      </button>
    </div>
  );
}
