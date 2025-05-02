/* =========================================================================
   types.d.ts  –  Déclarations globales pour HELPR
   ========================================================================= */

declare module "@/types" {
  /* --------------------------------------------------------------------- */
  /*  ENUMS                                                                */
  /* --------------------------------------------------------------------- */
  export type MessageStatus = "SENT" | "DELIVERED" | "READ";
  export type SenderType = "user" | "worker" | "guest" | "system";
  export type AppointmentStatus =
    | "REQUESTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "ARCHIVED"; // ← nouveau

  // *** clé de discriminant ***
  export type ChatEventKind =
    | "appointment_requested"
    | "appointment_confirmed"
    | "appointment_cancelled"
    | "appointment_completed" // 👈  ajoute-le ici
    | "review_added";

  /* --------------------------------------------------------------------- */
  /*  WORKERS                                                              */
  /* --------------------------------------------------------------------- */
  export interface WorkerType {
    id: string;
    full_name: string;
    skill: string;
    category: string;
    rating: number;
    profile_image_url?: string;
    description?: string;
    hourly_rate?: number;
    coverUrl?: string;
    coverColor?: string;
    appointmentDate?: string;
    appointmentId?: string;
  }

  export interface WorkerParams {
    full_name: string;
    skill: string;
    category: string;
    rating?: number;
    profile_image_url?: string;
    coverColor?: string;
    description?: string;
    summary?: string;
    totalSlots?: number;
  }

  /* --------------------------------------------------------------------- */
  /*  APPOINTMENTS                                                         */
  /* --------------------------------------------------------------------- */
  export interface Appointment {
    id: string;
    worker_id: string;
    user_id: string | null;
    guest_session_id: string | null;
    start_time: Date;
    end_time: Date;
    status: AppointmentStatus;
    notes?: string | null;
    created_at: Date;
    updated_at: Date;
  }

  /* --------------------------------------------------------------------- */
  /*  REVIEWS                                                              */
  /* --------------------------------------------------------------------- */
  export interface Review {
    id: string;
    worker_id: string;
    author_id: string | null;
    guest_session_id: string | null;
    rating: number;
    comment: string;
    created_at: Date;
    updated_at: Date;
  }

  /* --------------------------------------------------------------------- */
  /*  CHAT – Messages & Conversations                                      */
  /* --------------------------------------------------------------------- */
  export type ChatMessage = {
    id: string;
    content: string;
    created_at: Date;
    sender_type: SenderType;
    sender_id: string | null;
    guest_session_id: string | null;
    receiver_id: string | null;
    status: MessageStatus | null;
    read_at: Date | null;
  };

  export interface ChatParticipant {
    id: string;
    full_name: string;
    profile_image_url: string | null;
  }

  export type ChatConversation = {
    id: string;
    worker: ChatParticipant;
    user: ChatParticipant | null;
    guestSession: { id: string; full_name: string } | null;
    messages: ChatMessage[];
    events: ChatEvent[];
  };

  /* --------------------------------------------------------------------- */
  /*  CHAT – Évènements temps‑réel                                         */
  /* --------------------------------------------------------------------- */
  export interface AppointmentRequestedPayload {
    appointmentId: string;
    start: Date | string; // ISO string quand ça arrive par socket
    end: Date | string;
    workerId: string;
  }
  type AppointmentPayload = {
    appointmentId: string;
    start: string; // ISO
    end: string;
    workerId: string;
    status: "REQUESTED" | "CONFIRMED" | "DRAFT";
  };

  export interface AppointmentConfirmedPayload {
    appointmentId: string;
    start: Date | string;
    end: Date | string;
    workerId: string;
  }

  export interface ReviewAddedPayload {
    reviewId: string;
    rating: number;
    comment: string;
    workerId: string;
  }

  export interface AppointmentConfirmedPayload
    extends AppointmentRequestedPayload {}

  export interface AppointmentCancelledPayload
    extends AppointmentRequestedPayload {}

  export interface AppointmentCompletedPayload
    extends AppointmentRequestedPayload {}
  /* ↓ mettre‑à‑jour l’union */
  export type ChatEventPayload =
    | AppointmentRequestedPayload
    | AppointmentConfirmedPayload
    | AppointmentCancelledPayload
    | AppointmentCompletedPayload // 👈  et ici
    | ReviewAddedPayload;

  export interface ChatEvent {
    id: string;
    conversation_id: string;
    type: ChatEventKind;
    payload: ChatEventPayload;
    sender_id: string;
    created_at: Date;
  }
}

declare module "@/hooks/use-toast" {
  interface ToastOptions {
    variant?: "default" | "destructive" | "success";
  }
}

/* ==== FIN types.d.ts ==================================================== */
