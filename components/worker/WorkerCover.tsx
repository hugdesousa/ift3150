"use client";

import React from "react";
import { cn } from "@/lib/utils/utils";
import { IKImage } from "imagekitio-next";
import config from "@/lib/config";

type WorkerCoverVariant =
  | "extraSmall"
  | "small"
  | "medium"
  | "regular"
  | "wide";

const variantStyles: Record<WorkerCoverVariant, string> = {
  extraSmall: "worker-cover_extra_small",
  small: "worker-cover_small",
  medium: "worker-cover_medium",
  regular: "worker-cover_regular",
  wide: "worker-cover_wide",
};

interface Props {
  className?: string;
  variant?: WorkerCoverVariant;
  coverColor: string;
  coverImage: string;
}

const WorkerCover = ({
  className,
  variant = "regular",
  coverColor = "#012B48",
  coverImage = "https://placehold.co/400x600.png",
}: Props) => {
  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        variantStyles[variant],
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: coverColor, opacity: 0.3 }}
      />
      <div className="absolute inset-0 z-10">
        <IKImage
          path={coverImage}
          urlEndpoint={config.env.imagekit.urlEndpoint}
          alt="Worker picture"
          fill
          className="object-cover"
          loading="lazy"
          lqip={{ active: true }}
        />
      </div>
    </div>
  );
};

export default WorkerCover;
