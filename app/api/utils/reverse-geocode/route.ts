import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat & lng required" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
    const data = await fetch(url, {
      headers: { "User-Agent": "helpr-app/1.0" },
    }).then((r) => r.json());

    const label =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      data.display_name;

    return NextResponse.json({
      label: label ?? "Localisation inconnue",
    });
  } catch (err) {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
