"use client";
import { useEffect, useState } from "react";

export default function CategoryPicker({
  category,
  initial = [],
  onChange,
}: {
  category: string;
  initial?: string[];
  onChange: (skills: string[]) => void;
}) {
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>(initial);
  const [loading, setLoading] = useState(false);

  /* fetch dès que la catégorie change */
  useEffect(() => {
    if (!category) {
      setSkills([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/workers/skills?category=${encodeURIComponent(category)}`,
        );
        const data = (await r.json()) as string[];
        setSkills(Array.isArray(data) ? data : []);
      } catch {
        setSkills([]);
      } finally {
        setLoading(false);
        setSelected([]); // reset
      }
    })();
  }, [category]);

  /* remonter sélection */
  useEffect(() => onChange(selected), [selected, onChange]);

  /* UI */
  if (!category) return null;
  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!skills.length)
    return (
      <p className="text-sm text-red-600">
        Aucune compétence trouvée pour «&nbsp;{category}&nbsp;»
      </p>
    );

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => {
        const active = selected.includes(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() =>
              setSelected((prev) =>
                active ? prev.filter((t) => t !== s) : [...prev, s],
              )
            }
            className={`rounded-full px-3 py-1 text-xs ${
              active
                ? "bg-amber-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
