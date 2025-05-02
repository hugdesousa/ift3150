"use client";

import React from "react";
import Image from "next/image";
import WorkerCover from "@/components/worker/WorkerCover";
import TakeAppointment from "@/components/appointment/TakeAppointment"; // Nouveau composant pour prendre un rendez‑vous
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { WorkerType } from "@/types"; // Assure-toi que ce chemin est correct

interface Props extends WorkerType {
  userId: string;
}

const WorkerOverview = async ({
  fullName,
  skill,
  category,
  rating,
  totalSlots,
  availableSlots,
  description,
  coverColor,
  coverUrl,
  id,
  userId,
  summary,
}: Props) => {
  // Récupère l'utilisateur pour vérifier l'éligibilité, par exemple
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const appointmentEligibility = {
    isEligible: availableSlots > 0 && user?.status === "APPROVED",
    message:
      availableSlots <= 0
        ? "Worker is not available"
        : "You are not eligible to book an appointment with this worker",
  };

  return (
    <section className="worker-overview flex flex-col gap-8 md:flex-row">
      <div className="flex flex-1 flex-col gap-5">
        <h1 className="text-4xl font-bold text-white">{fullName}</h1>

        <div className="worker-info space-y-2">
          <p>
            <strong>Skill:</strong>{" "}
            <span className="font-semibold text-light-200">{skill}</span>
          </p>
          <p>
            <strong>Category:</strong>{" "}
            <span className="font-semibold text-light-200">{category}</span>
          </p>
          <div className="flex items-center gap-1">
            <Image src="/icons/star.svg" alt="star" width={22} height={22} />
            <p className="text-lg text-white">{rating}</p>
          </div>
        </div>

        <div className="worker-slots space-y-2">
          <p>
            <strong>Total Slots:</strong> <span>{totalSlots}</span>
          </p>
          <p>
            <strong>Available Slots:</strong> <span>{availableSlots}</span>
          </p>
        </div>

        <p className="worker-description text-white">{description}</p>

        {summary && (
          <div className="worker-summary space-y-2">
            {summary.split("\n").map((line, i) => (
              <p key={i} className="text-lg text-light-100">
                {line}
              </p>
            ))}
          </div>
        )}

        {user && (
          <TakeAppointment
            workerId={id}
            userId={userId}
            appointmentEligibility={appointmentEligibility}
          />
        )}
      </div>

      <div className="relative flex flex-1 justify-center">
        <div className="relative">
          <WorkerCover
            variant="wide"
            className="z-10"
            coverColor={coverColor}
            coverImage={coverUrl}
          />
          <div className="absolute left-16 top-10 hidden rotate-12 opacity-40 sm:block">
            <WorkerCover
              variant="wide"
              coverColor={coverColor}
              coverImage={coverUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkerOverview;
