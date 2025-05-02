/* ------------------------------------------------------------------
   components/PrettyToast.tsx
   -> Utilisé avec toast.custom() (sonner)
------------------------------------------------------------------- */
import { X } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface PrettyToastProps {
  title: string;
  body: string;
  avatar?: string | null;
  onClick?: () => void;
  onClose: () => void;
}

export default function PrettyToast({
  title,
  body,
  avatar,
  onClick,
  onClose,
}: PrettyToastProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-lg border bg-white/70 p-4 text-left shadow-lg transition hover:bg-white/90 dark:bg-zinc-900/70 dark:hover:bg-zinc-900/90",
        "backdrop-blur supports-[backdrop-filter]:bg-white/60",
      )}
    >
      {/* bandeau coloré  */}
      <span className="mt-0.5 h-8 w-1 rounded-r bg-amber-500" />
      {/* avatar / icône */}
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
      )}
      {/* contenu */}
      <div className="flex flex-1 flex-col">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {/* close */}
      <X
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground"
      />
    </button>
  );
}
