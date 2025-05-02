import type { Geo } from "./filters";

/** Geocode une ville → { lat, lon } (OpenStreetMap / Nominatim) */
export async function geocodeCity(city: string): Promise<Geo> {
  if (!city.trim()) return null;
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
      encodeURIComponent(city);
    const res = await fetch(url, {
      headers: { "User-Agent": "Helpr/1.0 (contact@helpr.app)" },
    });
    const data: any[] = await res.json();
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  } catch {
    return null;
  }
}
