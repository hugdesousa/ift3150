// components/AvailabilityCalendar.tsx
"use client";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { addDays, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AvailabilityCalendar({
  workerId,
  userId,
  existingAppointments,
  timeZone,
}: {
  workerId: string;
  userId: string;
  existingAppointments: any[];
  timeZone: string;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Exemple de créneaux horaires
  const generateTimeSlots = () => {
    return ["09:00 - 10:00", "10:30 - 11:30", "13:00 - 14:00", "15:00 - 16:00"];
  };

  const fetchAvailability = async (selectedDate: Date) => {
    // Simulation de chargement
    setTimeout(() => {
      setTimeSlots(generateTimeSlots());
    }, 300);
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={async (selectedDate) => {
          setDate(selectedDate);
          if (selectedDate) await fetchAvailability(selectedDate);
        }}
        className="rounded-md border p-4"
        disabled={(date) => date < new Date()}
      />

      {date && (
        <div className="space-y-2">
          <h3 className="font-medium">
            Créneaux disponibles le {date.toLocaleDateString()}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.length > 0 ? (
              timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant="outline"
                  className="hover:bg-amber-50 hover:text-amber-900"
                >
                  {slot}
                </Button>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Chargement des créneaux...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
