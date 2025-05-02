import Image from "next/image";
import { BookOpen, Flame, Clock } from "lucide-react";

export default function WorkerHero({
  fullName,
  avatar,
  skill,
  description,
}: {
  fullName: string;
  avatar: string;
  skill: string;
  description: string;
}) {
  return (
    <section className="relative flex flex-col items-center pb-10 text-center">
      {/* fond “blob” */}
      <div className="absolute inset-0 -z-10 h-64 rounded-b-[40%] bg-gradient-to-br from-sky-300 via-sky-200 to-sky-100" />
      {/* nom / spécialité */}

      {/* avatar + badges */}
      <div className="relative mb-4 mt-5 size-40">
        <Image
          src={avatar}
          alt={fullName}
          fill
          className="rounded-full border-4 border-white object-cover shadow-xl"
        />
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-1 drop-shadow">
          <BookOpen className="iconBadge text-yellow-400" />
          <Flame className="iconBadge text-red-500" />
          <Clock className="iconBadge text-green-500" />
        </div>
      </div>

      {/* bio */}
      <p className="mt-4 max-w-md rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-gray-700 shadow">
        {description}
      </p>
    </section>
  );
}
