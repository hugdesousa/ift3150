/* =========================================================================
   app/(auth)/sign-up/page.tsx — Inscription (Client / Worker)
   ========================================================================= */
"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Tab } from "@headlessui/react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import { GeoSelector } from "@/components/ui/GeoSelector";
import type { Geo } from "@/lib/utils/filters";
import CategoryPicker from "@/components/worker/CategoryPicker";

export default function SignUpPage() {
  /* ---------------- state ---------------- */
  const [role, setRole] = useState<"USER" | "HELPR">("USER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- catégories & skills ---------- */
  const [cats, setCats] = useState<string[]>([]);
  const [cat, setCat] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/workers/categories")
      .then((r) => r.json())
      .then((arr: { category: string }[]) =>
        setCats(arr.map((o) => o.category)),
      )
      .catch(() => setCats([]));
  }, []);

  /* ---------- localisation (worker) -------- */
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<Geo>(null);
  const AVATAR_USER = "/icons/user-fill.svg";
  const AVATAR_WORKER = "/icons/bot-message.svg";
  /* ---------------- submit ----------------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      role,
      /* 👇 avatar selon le rôle */
      profileImageUrl: role === "HELPR" ? AVATAR_WORKER : AVATAR_USER,
    };

    if (role === "HELPR") {
      payload.skills = skills.join(",");
      payload.category = cat;
      payload.latitude = coords?.lat ?? null;
      payload.longitude = coords?.lon ?? null;
    }

    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await r.json();
    if (!r.ok) {
      setError(j.error);
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      redirect: false,
      email: payload.email,
      password: payload.password,
    });
    window.location.href = "/";
  }

  /* ---------------- UI -------------------- */
  return (
    /* conteneur scrollable pour mobile */
    <div className="flex h-[calc(100dvh-20rem)] flex-col overflow-y-auto px-4 pb-4">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-md space-y-6"
      >
        {/* ─── Onglets rôle ───────────────────────────────────────────── */}
        <Tab.Group
          selectedIndex={role === "USER" ? 0 : 1}
          onChange={(i) => setRole(i === 0 ? "USER" : "HELPR")}
        >
          <Tab.List className="flex rounded-lg bg-gray-100 p-1">
            {["Client", "Worker"].map((lbl) => (
              <Tab key={lbl} className="flex-1">
                {({ selected }) => (
                  <span
                    className={`block rounded-md px-4 py-2 text-center text-sm font-medium transition
                      ${
                        selected
                          ? "bg-white shadow ring-1 ring-gray-200"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {lbl}
                  </span>
                )}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>

        <h1 className="text-2xl font-bold">
          Inscription {role === "HELPR" && "Worker"}
        </h1>
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* ─── Champs communs ─────────────────────────────────────────── */}
        <input
          name="fullName"
          required
          className="input"
          placeholder="Nom complet"
        />
        <input
          name="email"
          required
          type="email"
          className="input"
          placeholder="Email"
        />
        <input
          name="password"
          required
          type="password"
          className="input"
          placeholder="Mot de passe"
        />

        {/* ─── Section WORKER ─────────────────────────────────────────── */}
        {role === "HELPR" && (
          <>
            {/* Catégorie principale */}
            <div className="space-y-1">
              <span className="font-medium">Catégorie principale</span>
              <div className="relative">
                <select
                  value={cat}
                  required
                  onChange={(e) => {
                    setCat(e.target.value);
                    setSkills([]);
                  }}
                  className="
                    block w-full appearance-none rounded-full border border-gray-300 bg-gray-50
                    px-4 py-2 pr-10 text-sm font-medium text-gray-700
                    focus:border-amber-500 focus:bg-white focus:outline-none
                  "
                >
                  <option value="">Choisir une catégorie…</option>
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

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

            {/* Localisation */}
            <GeoSelector
              label="Entrez votre ville…"
              allowGps={true}
              cityInput={city}
              setCityInput={setCity}
              coords={coords}
              setCoords={setCoords}
            />
          </>
        )}

        {/* ─── Bouton submit ──────────────────────────────────────────── */}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Inscription…" : "Créer mon compte"}
        </button>

        <p className="pt-2 text-center text-sm">
          Déjà inscrit&nbsp;?
          <Link href="/sign-in" className="ml-1 text-amber-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
