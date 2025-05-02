/* =========================================================================
   components/ProfileForm.tsx – v3 (fix validation / redirect)
   ========================================================================= */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";

import FileUpload from "@/components/ui/FileUpload";
import { Button } from "@/components/ui/button";
import CalendarAvailabilityPicker, {
  Slot,
} from "@/components/appointment/CalendarAvailabilityPicker";
import CategoryPicker from "@/components/worker/CategoryPicker";
import { GeoSelector } from "@/components/ui/GeoSelector";
import type { Geo } from "@/lib/utils/filters";
import { ChevronDown, DollarSign, LocateFixed } from "lucide-react";

/* ---------- 1. Schémas Zod ---------- */
const userSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().optional(),
  profileImageUrl: z.string().url(),
});

const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

/* <-- ⚠️ disponibilité optionnelle / skill ≥ 0 ------------------------- */
const workerSchema = z.object({
  category: z.string().min(2),
  hourlyRate: z.coerce.number().min(0),
  description: z.string().min(10),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  skill: z.array(z.string()).min(0),
  availability: z.array(slotSchema).optional().default([]),
});

/* ---------- 2. Props ---------- */
export interface ProfileFormProps {
  userId: string;
  current: { fullName: string; email: string; profileImageUrl?: string | null };
  isWorker: boolean;
  worker?: {
    category: string;
    hourlyRate: number;
    description: string;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    skill: string[];
    availability: { weekly: Slot[] };
  } | null;
}

/* =========================================================================
   3. Composant principal
   ========================================================================= */
export default function ProfileForm({
  userId,
  current,
  isWorker,
  worker,
}: ProfileFormProps) {
  const router = useRouter();
  const imgBase = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "";

  /* ---------------- RHF ---------------- */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(
      isWorker ? userSchema.merge(workerSchema) : userSchema,
    ),
    defaultValues: {
      fullName: current.fullName,
      email: current.email,
      password: "",
      profileImageUrl: current.profileImageUrl ?? "/icons/user-fill.svg",
      ...(isWorker && {
        category: worker?.category ?? "",
        hourlyRate: worker?.hourlyRate ?? 0,
        description: worker?.description ?? "",
        location: worker?.location ?? "",
        latitude: worker?.latitude ?? undefined,
        longitude: worker?.longitude ?? undefined,
        skill: worker?.skill ?? [],
        availability: worker?.availability?.weekly ?? [],
      }),
    } as any,
  });

  /* ---------------- state locaux ---------------- */
  const [cats, setCats] = useState<string[]>([]);
  const [cat, setCat] = useState(worker?.category ?? "");
  const [skills, setSkills] = useState<string[]>(worker?.skill ?? []);
  const [slots, setSlots] = useState<Slot[]>(
    worker?.availability?.weekly ?? [],
  );

  /* localisation -------------------------------- */
  const [city, setCity] = useState(worker?.location ?? "");
  const [coords, setCoords] = useState<Geo>(
    worker?.latitude && worker?.longitude
      ? { lat: worker.latitude, lon: worker.longitude }
      : null,
  );

  /* fetch catégories ----------------------------- */
  useEffect(() => {
    fetch("/api/workers/categories")
      .then((r) => r.json())
      .then((arr: { category: string }[]) =>
        setCats(arr.map((o) => o.category)),
      )
      .catch(() => setCats([]));
  }, []);

  /* sync skills -> RHF --------------------------- */
  useEffect(() => {
    setValue("skill", skills, { shouldValidate: true });
  }, [skills, setValue]);

  /* sync slots -> RHF ---------------------------- */
  useEffect(() => {
    setValue("availability", slots, { shouldValidate: true });
  }, [slots, setValue]);

  /* avatar preview ------------------------------- */
  const filePath = watch("profileImageUrl");
  const avatar = filePath?.startsWith("http")
    ? filePath
    : `${imgBase}${filePath}`;

  /* toggle cellule calendrier -------------------- */
  const handleSlots = useCallback((arr: Slot[]) => setSlots(arr), [setSlots]);

  /* change catégorie ----------------------------- */
  const handleCat = (e: ChangeEvent<HTMLSelectElement>) => {
    setCat(e.target.value);
    setSkills([]);
  };

  /* ------ soumission (POST) ------ */
  async function onSubmit(data: any) {
    const payload = {
      ...data,
      category: cat,
      skill: skills.join(","),
      availability: { weekly: slots, exceptions: [] },
      location: city,
      latitude: coords?.lat ?? null,
      longitude: coords?.lon ?? null,
      userId,
    };

    const r = await fetch("/api/auth/updateProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();

    if (j.success) {
      toast.success("Profil mis à jour ✔︎");
      j.redirect ? router.push(j.redirect) : router.refresh();
    } else {
      toast.error(j.error ?? "Erreur inconnue");
    }
  }

  /* feedback validation -------------------------- */
  function onInvalid(es: any) {
    const first = Object.values(es)[0] as any;
    toast.error(
      typeof first?.message === "string"
        ? first.message
        : "Merci de corriger les champs indiqués.",
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="mx-auto flex max-w-3xl flex-col gap-10 px-2 py-12"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* --- Avatar --- */}
      <section className="flex flex-col items-center gap-4">
        <div className="relative size-48 overflow-hidden rounded-full ring-2 ring-[#e6f0fa]">
          <Image src={avatar} alt="Avatar" fill className="object-cover" />
        </div>
        <FileUpload
          type="image"
          folder="profiles"
          accept="image/*"
          placeholder="Modifier la photo"
          value={filePath}
          variant="light"
          className="w-auto"
          onFileChange={(p) =>
            setValue(
              "profileImageUrl",
              p.startsWith("http") ? p : `${imgBase}${p}`,
            )
          }
        />
      </section>

      {/* --- Infos perso --- */}
      <section className="grid gap-4">
        <Field
          label="Nom complet"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <Field
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Mot de passe"
          type="password"
          placeholder="Laisser vide pour ne pas changer"
          {...register("password")}
        />
      </section>

      {/* --- Worker --- */}
      {isWorker && (
        <section className="grid gap-8 border-t pt-8">
          <h3 className="text-lg font-semibold">Profil HELPR</h3>

          {/* Catégorie */}
          <label className="space-y-1">
            <span className="font-medium">Catégorie principale</span>
            <div className="relative">
              <select
                value={cat}
                required
                onChange={handleCat}
                className="block w-full appearance-none rounded-full border border-gray-300
                         bg-gray-50 px-4 py-2 pr-10 text-sm font-medium
                         text-gray-700 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="">Choisir…</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>
          </label>

          {/* Compétences */}
          <div className="space-y-1">
            <span className="font-medium">Compétences</span>
            <CategoryPicker
              category={cat}
              initial={skills}
              onChange={setSkills}
            />
            {skills.length === 0 && (
              <p className="text-xs text-red-600">
                Au moins une compétence requise
              </p>
            )}
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            rows={4}
            error={errors.description?.message}
            {...register("description")}
          />

          {/* Tarif + Localisation */}
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Tarif */}
            <label className="flex-1 space-y-1">
              <span className="font-medium">Tarif ($/h)</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <DollarSign className="size-4" />
                </span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  placeholder="0"
                  className="input pl-9"
                  {...register("hourlyRate", { valueAsNumber: true })}
                />
              </div>
            </label>

            {/* Ville */}
            <div className="flex-1 space-y-1">
              <span className="font-medium">Localisation</span>
              <GeoSelector
                allowGps
                placeholder="Entrez votre ville…"
                rightIcon={<LocateFixed className="size-4 text-gray-400" />}
                cityInput={city}
                setCityInput={setCity}
                coords={coords}
                setCoords={setCoords}
              />
            </div>
          </div>

          {/* Disponibilités */}
          <details className="rounded-md border">
            <summary className="cursor-pointer select-none p-3 font-medium">
              Disponibilités {slots.length ? `(${slots.length})` : ""}
            </summary>
            <div className="p-4">
              <CalendarAvailabilityPicker
                initial={slots}
                onChange={handleSlots}
              />
            </div>
          </details>
        </section>
      )}

      <Button disabled={isSubmitting} className="mx-auto mt-4 w-full max-w-xs">
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </motion.form>
  );
}

/* ---------- sous-composants ---------- */
const Field = ({ label, error, className = "", ...props }: any) => (
  <label className="space-y-1">
    <span className="font-medium">{label}</span>
    <input {...props} className={`w-full rounded border p-2 ${className}`} />
    {error && <p className="text-sm text-red-600">{error}</p>}
  </label>
);

const Textarea = ({ label, error, className = "", ...props }: any) => (
  <label className="space-y-1">
    <span className="font-medium">{label}</span>
    <textarea {...props} className={`w-full rounded border p-2 ${className}`} />
    {error && <p className="text-sm text-red-600">{error}</p>}
  </label>
);
