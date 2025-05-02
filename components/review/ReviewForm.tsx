// =============================================================
// components/ReviewForm.tsx
// =============================================================
"use client";
import { useState } from "react";
import { createReview } from "@/lib/actions/reviews";
import { Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ReviewForm({
  appointmentId,
  onDone,
}: {
  appointmentId: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!rating || comment.length < 5) return;
    setBusy(true);
    try {
      await createReview({ appointmentId, rating, comment });
      toast({ title: "Merci pour votre avis !" });
      onDone?.();
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            onClick={() => setRating(n)}
            className={`size-6 cursor-pointer ${n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded border p-2"
        rows={3}
        placeholder="Décrivez votre expérience..."
      />
      <button
        onClick={submit}
        disabled={busy || !rating || comment.length < 5}
        className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {busy ? "Envoi…" : "Envoyer l'avis"}
      </button>
    </div>
  );
}
