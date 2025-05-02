// ift3150/components/AppointmentCard.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface AppointmentCardProps {
  appointmentId: string;
  workerId: string;
  fullName: string;
  skill: string;
  coverUrl: string;
  appointmentDate: string;
  userId: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointmentId,
  workerId,
  fullName,
  skill,
  coverUrl,
  appointmentDate,
  userId,
}) => {
  const router = useRouter();
  const [canceling, setCanceling] = useState(false);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const res = await fetch("/api/cancel-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, userId }),
      });
      const result = await res.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Appointment cancelled successfully",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel appointment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while cancelling the appointment",
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="rounded bg-white p-4 shadow">
      <div className="relative mb-4 h-48 w-full overflow-hidden rounded">
        <img src={coverUrl} alt={fullName} className="size-full object-cover" />
      </div>
      <h3 className="mb-1 text-lg font-bold text-gray-800">{fullName}</h3>
      <p className="mb-2 text-sm text-gray-600">{skill}</p>
      <p className="mb-2 text-sm text-gray-600">
        Rendez-vous prévu le : {appointmentDate}
      </p>
      <div className="flex gap-2">
        <Link
          href={`/workers/${workerId}`}
          className="flex-1 rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-dark-100 hover:bg-primary/90"
        >
          Voir le profil
        </Link>
        <button
          onClick={handleCancel}
          disabled={canceling}
          className="flex-1 rounded bg-red-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-red-600"
        >
          {canceling ? "Annulation..." : "Annuler"}
        </button>
      </div>
    </div>
  );
};

export default AppointmentCard;
