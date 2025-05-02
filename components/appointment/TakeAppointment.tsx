"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { takeAppointment } from "@/lib/actions/appointment"; // Assure-toi d'avoir créé cette action

interface Props {
  userId: string;
  workerId: string;
  appointmentEligibility: {
    isEligible: boolean;
    message: string;
  };
}

const TakeAppointment = ({
  userId,
  workerId,
  appointmentEligibility: { isEligible, message },
}: Props) => {
  const router = useRouter();
  const [booking, setBooking] = useState(false);

  const handleTakeAppointment = async () => {
    if (!isEligible) {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setBooking(true);

    try {
      const result = await takeAppointment({ workerId, userId });

      if (result.success) {
        toast({
          title: "Success",
          description: "Appointment booked successfully",
        });

        router.push("/my-profile");
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while booking the appointment",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <Button
      className="worker-overview_btn"
      onClick={handleTakeAppointment}
      disabled={booking}
    >
      <Image src="/icons/calendar.svg" alt="calendar" width={20} height={20} />
      <p className="font-bebas-neue text-xl text-dark-100">
        {booking ? "Booking..." : "Book Appointment"}
      </p>
    </Button>
  );
};

export default TakeAppointment;
