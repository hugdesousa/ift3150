/* =========================================================================
   components/FileUpload.tsx
   ========================================================================= */
"use client";

import { IKUpload, ImageKitProvider } from "imagekitio-next";
import { useRef, useState } from "react";
import Image from "next/image";

import config from "@/lib/config";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils/utils";

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  const res = await fetch(`${config.env.apiEndpoint}/api/imagekit`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ImageKit auth failed ${res.status}: ${errText}`);
  }
  const { signature, expire, token } = await res.json();
  return { token, expire, signature };
};

interface Props {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  folder: string;
  variant: "dark" | "light";
  onFileChange: (filePath: string) => void;
  value?: string;
  className?: string; // ⬅️ permet d’ajouter des classes externes
}

export default function FileUpload({
  type,
  accept,
  placeholder,
  folder,
  variant,
  onFileChange,
  value,
  className = "",
}: Props) {
  const ikUploadRef = useRef<HTMLInputElement | null>(null);

  const [progress, setProgress] = useState(0);

  const styles = {
    button:
      variant === "dark"
        ? "bg-dark-300 hover:bg-dark-400"
        : "bg-light-600 border border-gray-200 hover:bg-gray-100",
    text: variant === "dark" ? "text-light-100" : "text-gray-700",
  };

  /* ---------- helpers ---------- */
  const onError = () =>
    toast({
      title: `${type} upload failed`,
      description: `Votre ${type} n'a pas pu être envoyé, réessayez.`,
      variant: "destructive",
    });

  const onSuccess = (res: any) => {
    onFileChange(res.url); // contient l’URL complète
    toast({
      title: `${type} uploadé !`,
      description: res.url,
    });
    setProgress(0);
  };

  const onValidate = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Type non supporté",
        description: "Formats acceptés : JPEG, PNG, HEIC/HEIF…",
        variant: "destructive",
      });
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Fichier trop lourd",
        description: "Max : 20 Mo",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      {/* champ caché */}
      <IKUpload
        ref={ikUploadRef as any}
        className="hidden"
        folder={folder}
        accept={accept}
        validateFile={onValidate}
        useUniqueFileName
        onUploadStart={() => setProgress(0)}
        onUploadProgress={({ loaded, total }) =>
          setProgress(Math.round((loaded / total) * 100))
        }
        onError={onError}
        onSuccess={onSuccess}
      />

      {/* bouton compact */}
      <button
        type="button"
        onClick={() => ikUploadRef.current?.click()}
        className={cn(
          "inline-flex w-auto items-center gap-2 rounded px-3 py-1.5 text-sm",
          styles.button,
          className,
        )}
      >
        <Image src="/icons/upload.svg" alt="" width={18} height={18} />
        <span className={styles.text}>{placeholder}</span>
      </button>

      {/* barre de progression */}
      {progress > 0 && progress < 100 && (
        <div className="mt-2 h-1 w-full rounded bg-gray-200">
          <div
            style={{ width: `${progress}%` }}
            className="h-full rounded bg-amber-500 transition-all"
          />
        </div>
      )}
    </ImageKitProvider>
  );
}
