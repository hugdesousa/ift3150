/* carte avis minifiée pour carrousel */
"use client";
import { Star } from "lucide-react";

type Props = {
  rating: number;
  comment: string;
  author: string;
  since: string;
  className?: string;
};

export default function ReviewCard({
  rating,
  comment,
  author,
  since,
  className = "",
}: Props) {
  return (
    <article className={`rounded-xl bg-white p-4 shadow ${className}`}>
      <div className="mb-1 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <p className="line-clamp-3 text-sm text-gray-800">{comment}</p>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{author}</span>
        <span>membre&nbsp;depuis&nbsp;{since}</span>
      </div>
    </article>
  );
}
