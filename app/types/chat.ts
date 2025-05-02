export type AppointmentEvent = {
  kind: "appointment";
  /** pour rattacher l’évènement à la bonne conversation */
  conversationId: string;
  appointmentId: string;

  /** infos rendez‑vous */
  start: string; // ISO‑date
  end: string; // ISO‑date
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  /** date de création de l’event */
  created_at: string; // ISO‑date
};

export type ReviewEvent = {
  kind: "review";
  conversationId: string;
  reviewId: string;
  rating: number;
  comment: string;
  created_at: string;
};
/* ------------------------------------------------------------------ */
/*  Types de base                                                     */
/* ------------------------------------------------------------------ */

export type ChatMessage = {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: "user" | "worker" | "guest" | "system";
  sender_id: string | null;
  receiver_id: string | null;
  status: "SENT" | "DELIVERED" | "READ";
  created_at: string; // ISO
};

/* ------------------------------------------------------------------ */
/*  Évènements structurés émis par le serveur (table chat_events)      */
/* ------------------------------------------------------------------ */

export type AppointmentRequestedEvent = {
  id: string;
  conversation_id: string;
  type: "appointment_requested";
  payload: {
    appointmentId: string;
    start: string; // ISO
    end: string; // ISO
    workerId: string;
  };
  created_at: string;
};

export type AppointmentConfirmedEvent = {
  id: string;
  conversation_id: string;
  type: "appointment_confirmed";
  payload: {
    appointmentId: string;
    start: string;
    end: string;
  };
  created_at: string;
};

/* ------------------------------------------------------------------ */
/*  Union utilisable côté client                                      */
/* ------------------------------------------------------------------ */

/** Union de tous les évènements qui peuvent circuler dans le chat */
export type ChatEvent = AppointmentEvent | ReviewEvent;
