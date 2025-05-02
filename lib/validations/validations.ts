/* =========================================================================
   lib/validations.ts — schémas Zod alignés sur schema.ts
   ========================================================================= */
import { z } from "zod";

/* ─────────── ENUMS (copiés de pgEnum) ─────────── */
export const userStatusEnum = z.enum(["PENDING", "ACTIVE", "SUSPENDED"]);
export const userRoleEnum = z.enum(["USER", "ADMIN", "HELPR"]);
export const appStatusEnum = z.enum([
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

/* ─────────── Auth ─────────── */
export const signUpSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/* ─────────── User profile ─────────── */
export const userSchema = z.object({
  id: z.string().uuid().optional(), // absent en création
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  profileImageUrl: z.string().url().optional(),
  status: userStatusEnum.optional(),
  role: userRoleEnum.optional(),
});

/* ─────────── Worker profile ─────────── */
export const workerSchema = z.object({
  id: z.string().uuid().optional(), // = users.id
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(7).max(20),

  category: z.string().min(2),
  skill: z.string().min(2),

  hourlyRate: z.coerce.number().positive().lte(10_000),
  location: z.string().min(2),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),

  description: z.string().trim().min(10).max(1_000),
  rating: z.coerce.number().min(0).max(5).optional(),
});

/* ─────────── Appointment ─────────── */
export const appointmentSchema = z
  .object({
    id: z.string().uuid().optional(),

    workerId: z.string().uuid(),
    /* userId OU guestSessionId doivent exister, on valide ça ensuite */
    userId: z.string().uuid().optional(),
    guestSessionId: z.string().uuid().optional(),

    startTime: z.coerce.date(), // ISO string → Date
    endTime: z.coerce.date(),

    status: appStatusEnum.optional(),
    initiator: z.enum(["user", "worker"]).default("user"),

    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(7).max(20).optional(),
    notes: z.string().max(2_000).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.userId && !val.guestSessionId) {
      ctx.addIssue({
        path: ["userId"],
        code: z.ZodIssueCode.custom,
        message: "userId ou guestSessionId requis",
      });
    }
  });

/* ─────────── Review ─────────── */
export const reviewSchema = z
  .object({
    id: z.string().uuid().optional(),

    appointmentId: z.string().uuid(),
    workerId: z.string().uuid(),

    /** Soit userId soit guestSessionId */
    userId: z.string().uuid().optional(),
    guestSessionId: z.string().uuid().optional(),

    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().min(2).max(2_000).optional(),
    tags: z.array(z.string().max(30)).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.userId && !val.guestSessionId) {
      ctx.addIssue({
        path: ["userId"],
        code: z.ZodIssueCode.custom,
        message: "userId ou guestSessionId requis",
      });
    }
  });

/* ─────────── Types TS utilitaires ─────────── */
export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type UserValues = z.infer<typeof userSchema>;
export type WorkerValues = z.infer<typeof workerSchema>;
export type AppointmentValues = z.infer<typeof appointmentSchema>;
export type ReviewValues = z.infer<typeof reviewSchema>;
