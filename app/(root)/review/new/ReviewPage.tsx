/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import ReviewTagPicker from "@/components/review/ReviewTagPicker";

type Worker = { id: string; name: string; avatar: string | null };

type Props = {
  appointmentId: string;
  start: string | Date; // ✅ requis et reçu
  worker: Worker;
};

export default function ReviewPage({ appointmentId, start, worker }: Props) {
  /* ------------------- state & helpers --------------------- */
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!rating) return toast({ title: "Note requise" });
    setLoading(true);

    const res = await fetch("/api/reviews/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, rating, comment, tags }),
    });

    if (res.ok) {
      toast({ title: "Merci pour votre avis !" });
      router.push("/my-appointments");
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d’enregistrer l’avis",
        variant: "destructive",
      });
    }
    setLoading(false);
  }

  /* ------------------- UI --------------------- */
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="sheet"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#f2f6ff]"
      >
        <div className="w-[320px] rounded-3xl bg-white p-6 shadow-xl">
          {/* — header — */}
          <button
            onClick={() => router.back()}
            className="mb-4 rounded-full border p-2 text-blue-800"
          >
            ←
          </button>

          <h1 className="text-center text-xl font-bold text-blue-800">Avis</h1>
          <p className="my-2 text-center text-sm text-gray-600">
            Travail complété&nbsp;le&nbsp;
            {new Date(start).toLocaleDateString("fr-CA")}
            <br />
            <span className="font-semibold text-amber-600">
              {worker.name} attend votre retour&nbsp;!
            </span>
          </p>

          {/* icône */}
          <div className="flex justify-center py-2">
            <img src="/icons/helmet-yellow.svg" alt="" className="size-24" />
          </div>

          {/* tags */}
          <ReviewTagPicker value={tags} onChange={setTags} />

          {/* commentaire */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Votre commentaire…"
            className="mt-4 h-28 w-full resize-none rounded-xl border p-3 text-sm focus:ring-blue-500"
          />

          {/* rating */}
          <div className="my-4 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                onClick={() => setRating(i + 1)}
                className={`size-7 cursor-pointer ${
                  i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 py-3 font-semibold text-white disabled:opacity-50"
          >
            Soumettre →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
