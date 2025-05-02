/* =========================================================================
   app/(root)/search/SearchClient.tsx — composant client
   ========================================================================= */
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, MapPin } from "lucide-react";
import { toast } from "sonner";

import { runSearch } from "./action"; // ← chemin corrigé
import { distanceKm, Worker } from "./shared";
import { defaultFilters, Filters } from "@/lib/utils/filters";

import SearchBarWithChips from "@/components/search/SearchBar"; // ← dossier components racine
import ActiveChips from "@/components/search/ActiveChips";
import FiltersPanel from "@/components/search/FiltersPanel";

/* suggestions initiales ------------------------------------------------- */
const POPULAR_SKILLS = [
  "Peintre",
  "Plombier",
  "Électricien",
  "Jardinier",
  "Mécanicien",
];

export default function SearchClient() {
  /* -------- lire la query depuis l'URL -------- */
  const sp = useSearchParams(); // jamais null
  const currentQ = sp?.get("q") ?? ""; // string

  const router = useRouter();

  /* états principaux ---------------------------------------------------- */
  const [search, setSearch] = useState(currentQ);
  const [suggestions, setSuggestions] = useState<string[]>([...POPULAR_SKILLS]);
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters });
  const [showFilters, setShowFilters] = useState(false);
  const [userCoords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [results, setResults] = useState<Worker[]>([]);
  const [isPending, startTransition] = useTransition();

  /* suggestions dynamiques --------------------------------------------- */
  const loadSuggestions = useCallback((term: string) => {
    if (!term) return setSuggestions([...POPULAR_SKILLS]);
    setSuggestions(
      POPULAR_SKILLS.filter((s) =>
        s.toLowerCase().includes(term.toLowerCase()),
      ).slice(0, 5),
    );
  }, []);

  /* exécution recherche ------------------------------------------------- */
  const execSearch = useCallback(
    (q: string) => {
      startTransition(async () => {
        const rows = await runSearch(q, filters, userCoords ?? undefined);
        setResults(rows);
      });
    },
    [filters, userCoords],
  );

  /* 1) Déclenche quand l'utilisateur tape (debounce) ------------------- */
  useEffect(() => {
    const id = setTimeout(() => {
      if (search.trim()) {
        execSearch(search);
        loadSuggestions(search);
      } else setResults([]);
    }, 300);
    return () => clearTimeout(id);
  }, [search, execSearch, loadSuggestions]);

  /* 2) Déclenche quand la barre d'adresse change (Header, lien, etc.) --- */
  useEffect(() => {
    setSearch(currentQ); // sync input
    if (currentQ.trim()) execSearch(currentQ);
    else setResults([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ]); // dépend seulement de l'URL

  /* -------------------------------------------------------------------- */
  return (
    <div
      className="scrollbar-none mx-auto flex h-[calc(100dvh-4rem)] w-full
                 max-w-7xl flex-col overflow-y-auto
                 px-4 pb-24 pt-8"
    >
      {/* barre de recherche */}
      <SearchBarWithChips
        search={search}
        setSearch={setSearch}
        suggestions={suggestions}
        chooseSuggestion={(s) => {
          setSearch(s);
          router.push(`/search?q=${encodeURIComponent(s)}`);
        }}
        showFilters={() => setShowFilters(true)}
        filters={filters}
        setFilters={setFilters}
        submit={(e: FormEvent) => {
          e.preventDefault();
          if (search.trim())
            router.push(`/search?q=${encodeURIComponent(search)}`);
        }}
      />

      {/* filtres actifs */}
      <ActiveChips filters={filters} setFilters={setFilters} />

      {/* panneau filtres */}
      <FiltersPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
        requestLocation={() => {
          if (!navigator.geolocation)
            return toast.error("Géolocalisation non supportée");
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setCoords({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              });
              setFilters((f) => ({ ...f, useLocation: true }));
            },
            () => toast.error("Impossible de récupérer la position"),
            { timeout: 8000 },
          );
        }}
      />

      {/* loader ou résultats */}
      {isPending ? (
        <Loader />
      ) : (
        <Results
          search={search}
          results={results}
          filters={filters}
          userCoords={userCoords}
        />
      )}
    </div>
  );
}

/* ---------------- Loader ---------------------------------------------- */
const Loader = () => (
  <div className="flex justify-center py-12">
    <div className="size-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
  </div>
);

/* ---------------- Résultats + WorkerCard ------------------------------ */
function Results({
  search,
  results,
  filters,
  userCoords,
}: {
  search: string;
  results: Worker[];
  filters: Filters;
  userCoords: { lat: number; lon: number } | null;
}) {
  return (
    <>
      <h2 className="mb-2 text-center text-3xl font-bold">
        {search ? `Résultats pour « ${search} »` : "Trouvez un professionnel"}
      </h2>
      <p className="mb-8 text-center text-gray-600">
        {results.length
          ? `${results.length} professionnel${
              results.length > 1 ? "s" : ""
            } trouvé${results.length > 1 ? "s" : ""}`
          : "Recherchez par nom ou compétence"}
      </p>

      {!!results.length && (
        <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
          {results.map((w) => (
            <WorkerCard
              key={w.id}
              w={w}
              filters={filters}
              userCoords={userCoords}
            />
          ))}
        </div>
      )}
    </>
  );
}

function WorkerCard({
  w,
  filters,
  userCoords,
}: {
  w: Worker;
  filters: Filters;
  userCoords: { lat: number; lon: number } | null;
}) {
  const btnW = "8rem";
  const dist =
    filters.useLocation &&
    userCoords &&
    w.latitude != null &&
    w.longitude != null
      ? Math.round(
          distanceKm(userCoords.lat, userCoords.lon, w.latitude, w.longitude),
        )
      : null;

  const skills = w.skill
    ? w.skill
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <article
      className="group relative grid grid-cols-[88px_1fr] gap-4 overflow-y-auto rounded-2xl bg-white p-4 shadow md:grid-cols-[96px_1fr]"
      style={{ "--btn-w": btnW } as React.CSSProperties}
    >
      {/* avatar */}
      <div className="flex flex-col items-center">
        <img
          src={w.profile_image_url || "/icons/worker.jpg"}
          alt={w.full_name}
          width={88}
          height={88}
          className="rounded-full object-cover md:size-[96px]"
        />
        <span className="mt-2 rounded-full bg-gray-50 px-3 py-0.5 text-xs font-semibold">
          {w.full_name.split(" ")[0]}
        </span>
      </div>

      {/* contenu */}
      <div className="flex min-w-0 flex-col gap-2 overflow-y-auto">
        <span className="inline-flex self-start whitespace-nowrap rounded-full bg-gray-50 px-3 py-0.5 text-sm font-medium">
          {w.category}
        </span>

        <div className="flex flex-wrap gap-2 overflow-y-auto">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800"
            >
              {s}
            </span>
          ))}
        </div>

        <p className="line-clamp-3 pr-[calc(var(--btn-w)+1rem)] text-[11px] text-gray-600 md:text-sm">
          {w.description || "Aucune description fournie"}
        </p>
      </div>

      {/* localisation + note */}
      <div className="absolute right-4 top-4 flex flex-col items-end overflow-y-auto text-xs">
        <span className="flex items-center whitespace-nowrap text-gray-700">
          <MapPin className="mr-0.5 size-4 text-amber-500" />
          {dist != null ? `${dist} km` : (w.location ?? "—")}
        </span>
        {w.rating > 0 && (
          <span className="mt-1 flex items-center rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
            <Star className="mr-0.5 size-3 fill-amber-400" />
            {w.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* bouton */}
      <a
        href={`/workers/${w.id}`}
        className="absolute bottom-4 right-4 inline-flex h-11 w-[var(--btn-w)] items-center justify-center rounded-lg bg-amber-600 text-sm font-semibold text-white shadow hover:bg-amber-700 md:h-12"
      >
        Contacter
      </a>
    </article>
  );
}
