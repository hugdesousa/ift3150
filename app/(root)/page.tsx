// app/(root)/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send } from "lucide-react";
import React, { useEffect, useState } from "react";

/* ---- icônes --------------------------------------------- */
const baseTools = [
  {
    image:
      "https://ik.imagekit.io/wbbxpnig8/assets/ressources/rouleau-peinture.svg",
    alt: "Rouleau",
  },
  {
    image:
      "https://ik.imagekit.io/wbbxpnig8/assets/ressources/boite-outils.svg",
    alt: "Boîte",
  },
  {
    image:
      "https://ik.imagekit.io/wbbxpnig8/assets/ressources/debouche-toilette.svg",
    alt: "Ventouse",
  },
  {
    image: "https://ik.imagekit.io/wbbxpnig8/assets/ressources/drill-outil.svg",
    alt: "Perceuse",
  },
];
const tools = Array.from(
  { length: baseTools.length * 4 },
  (_, i) => baseTools[i % baseTools.length],
);

/* ---- constantes visu ------------------------------------- */
const HEADER_H = 50;
const GAP = 0;
const ICON_SIZE = 100;
const EXTRA_ROT = 45;
const RADIUS_PCT = 0.75; // rayon = 75 % largeur
const HELPR_FROM_BOTTOM = "4.5rem"; // distance champ ↔ HELPR
const BUBBLE_ARM_LEVEL = "30%"; // hauteur bras ≃ 30 % image

export default function HomePage() {
  const router = useRouter();
  const [radius, setRadius] = useState(180);

  /* rayon dynamique ---------------------------------------- */
  useEffect(() => {
    const update = () => setRadius(window.innerWidth * RADIUS_PCT);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const centerY = HEADER_H + GAP + radius;
  const diameter = radius * 2;

  return (
    <div className="fixed inset-0 bg-white pt-20" style={{ height: "100dvh" }}>
      <div className="relative size-full overflow-hidden">
        {/* ------------- orbite (moitié haute, devant le bot) ------------- */}
        <div
          className="pointer-events-none absolute inset-0 z-[70] overflow-hidden"
          style={{ clipPath: "inset(0 0 50% 0)" }}
        >
          <div
            className="absolute left-1/2"
            style={{
              top: centerY,
              width: diameter,
              height: diameter,
              marginLeft: -radius,
              marginTop: -radius,
              animation: "spin 18s linear infinite",
            }}
          >
            {tools.map((tool, i) => {
              const angle = (360 / tools.length) * i;
              return (
                <Image
                  key={`${i}-${tool.alt}`}
                  src={tool.image}
                  alt={tool.alt}
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `
                      translate(-50%,-50%)
                      rotate(${angle}deg)
                      translate(${radius}px)
                      rotate(${EXTRA_ROT}deg)
                    `,
                  }}
                  loading="lazy"
                />
              );
            })}
          </div>
        </div>

        <div
          className="absolute left-1/2 z-[60] -translate-x-1/2"
          style={{ bottom: HELPR_FROM_BOTTOM }}
        >
          <div className="relative flex justify-center">
            {/* BULLE – devant tout (z‑80) */}
            <div
              className="absolute left-1/2 z-[90] -translate-x-1/2"
              style={{ top: "40%" }} /* ≃ hauteur des bras, ajuste 28‑35 % */
            >
              <div className="relative rounded-lg bg-white px-4 py-2 shadow-lg">
                <h2 className="whitespace-nowrap text-sm font-semibold text-[#395376]">
                  Comment pouvons‑nous vous aider&nbsp;?
                </h2>
                <span
                  className="absolute left-1/2 top-full block size-3 -translate-x-1/2 rotate-45 bg-white"
                  style={{ marginTop: "-40px" }}
                />
              </div>
            </div>

            {/* IMAGE HELPR (z‑60) */}
            <div className="relative aspect-[380/300] h-[90vh] max-h-[70vh] w-auto">
              <Image
                src="/icons/bot.svg"
                alt="HELPR"
                fill
                sizes="(max-height:700px) 80vw, 560px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* ------------- champ de recherche (fixe bas) -------- */}
        <form
          className="absolute bottom-4 left-1/2 z-40 flex w-[92%] max-w-sm -translate-x-1/2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.query as HTMLInputElement).value.trim();
            if (q) router.push(`/chat/bot?query=${encodeURIComponent(q)}`);
          }}
        >
          <input
            name="query"
            placeholder="Ex : J'ai une panne d’électricité…"
            className="flex-1 rounded-lg border border-[#395376] p-2 text-sm shadow-lg focus:border-blue-500 focus:outline-none"
          />
          <button className="flex items-center justify-center rounded-lg bg-[#344E72] px-3 text-white shadow-lg hover:bg-[#395376]">
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- globals.css (si manquant) ----------
@keyframes spin { to { transform: rotate(360deg); } }
------------------------------------------------ */
