/* =========================================================================
   SearchBarWithChips.tsx
   ========================================================================= */
"use client";

import { useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Filters } from "@/lib/utils/filters";

export default function SearchBarWithChips({
  search,
  setSearch,
  suggestions,
  chooseSuggestion,
  showFilters,
  filters,
  setFilters,
  submit,
}: {
  search: string;
  setSearch: (s: string) => void;
  suggestions: string[];
  chooseSuggestion: (s: string) => void;
  showFilters: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  submit: (e: React.FormEvent) => void;
}) {
  const [showSug, setShowSug] = useState(false);

  /* ---------------- field + buttons ---------------- */
  return (
    <>
      <form
        onSubmit={submit}
        className="relative top-4 z-30 mx-auto mb-4 max-w-2xl"
      >
        <div className="group relative flex items-center overflow-hidden rounded-full bg-white shadow-md transition-shadow focus-within:shadow-lg">
          <SearchIcon className="absolute left-4 size-5 text-gray-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            placeholder="Nom ou compétence…"
            className="w-full rounded-full bg-transparent py-3 pl-12 pr-14 focus:outline-none"
          />

          {/* effacer */}
          <motion.button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Effacer"
            whileTap={{ scale: 0.85 }}
            className={`absolute right-12 flex size-8 items-center justify-center rounded-full text-gray-400 transition-opacity hover:text-gray-600 ${
              search ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <X className="size-4" />
          </motion.button>

          {/* filtres */}
          <motion.button
            type="button"
            aria-label="Filtres"
            whileTap={{ scale: 0.9 }}
            onClick={showFilters}
            className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
          >
            <SlidersHorizontal className="size-5" />
          </motion.button>
        </div>

        {/* suggestions animées */}
        <AnimatePresence>
          {showSug && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => chooseSuggestion(s)}
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* ---------------- chips filtres actifs ---------------- */}
      <div className="mb-6 flex flex-wrap gap-2">
        <AnimatePresence>
          {filters.minPrice > 0 && (
            <FilterChip
              key="min"
              label={`≥ ${filters.minPrice}$`}
              onClear={() => setFilters((f) => ({ ...f, minPrice: 0 }))}
            />
          )}
          {filters.maxPrice < 1000 && (
            <FilterChip
              key="max"
              label={`≤ ${filters.maxPrice}$`}
              onClear={() => setFilters((f) => ({ ...f, maxPrice: 1000 }))}
            />
          )}
          {filters.rating > 0 && (
            <FilterChip
              key="rating"
              label={`${filters.rating}★ +`}
              onClear={() => setFilters((f) => ({ ...f, rating: 0 }))}
            />
          )}
          {filters.useLocation && (
            <FilterChip
              key="geo"
              label={`≤ ${filters.radius} km`}
              onClear={() => setFilters((f) => ({ ...f, useLocation: false }))}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* --------------------------------------------------------------------- */
/* Chip animé                                                             */
function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
    >
      {label}
      <X
        className="size-4 cursor-pointer opacity-70 hover:opacity-100"
        onClick={onClear}
      />
    </motion.span>
  );
}
