/* ------------------------------------------------------------------
   components/WorkerCard.tsx
   ------------------------------------------------------------------ */
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import type { Worker } from "@/types"; // ← alias pour workers.$inferSelect

export default function WorkerCard({
  w,
  distKm, // nombre || null (déjà calculé côté parent)
}: {
  w: Worker;
  distKm: number | null;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-lg">
      {/* -------- header image -------- */}
      <div className="relative h-40 w-full shrink-0">
        <Image
          src={w.profile_image_url || "/icons/worker.jpg"}
          alt={w.full_name}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {w.rating >= 4 && (
          <CheckCircle2 className="absolute left-2 top-2 size-6 rounded-full bg-white p-0.5 text-green-500" />
        )}
      </div>

      {/* -------- body -------- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* nom + rating */}
        <div className="flex items-start justify-between">
          <div className="text-base font-semibold leading-snug">
            {w.full_name}
          </div>
          {w.rating !== null && w.rating > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {w.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* localisation */}
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="size-3 text-amber-500" />
          {w.location || "Montréal"}
          {distKm != null && (
            <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
              {distKm} km
            </span>
          )}
        </p>

        {/* skill badge */}
        <span className="inline-block w-max rounded-full bg-blue-50 px-3 py-0.5 text-[11px] font-medium text-blue-800">
          {w.skill}
        </span>

        {/* description */}
        <p className="line-clamp-2 text-xs text-gray-600">
          {w.description || "—"}
        </p>

        {/* footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-gray-900">
            {w.hourly_rate ? `${w.hourly_rate}$/h` : "Tarif libre"}
          </span>
          <Link
            href={`/workers/${w.id}`}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Contacter
          </Link>
        </div>
      </div>
    </article>
  );
}
