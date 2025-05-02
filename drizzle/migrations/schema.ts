import {
  pgTable,
  index,
  foreignKey,
  uuid,
  integer,
  text,
  timestamp,
  unique,
  varchar,
  jsonb,
  doublePrecision,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appointmentStatus = pgEnum("appointment_status", [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);
export const chatEventKind = pgEnum("chat_event_kind", [
  "appointment",
  "review",
]);
export const messageStatus = pgEnum("message_status", [
  "SENT",
  "DELIVERED",
  "READ",
]);
export const userRole = pgEnum("user_role", ["USER", "ADMIN", "HELPR"]);
export const userStatus = pgEnum("user_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
]);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workerId: uuid("worker_id").notNull(),
    userId: uuid("user_id"),
    guestSessionId: uuid("guest_session_id"),
    rating: integer().notNull(),
    tags: text("tags")
      .array()
      .default(sql`ARRAY[]::text[]`),
    comment: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    appointmentId: uuid("appointment_id").notNull(),
  },
  (table) => [
    index("rev_guest_idx").using(
      "btree",
      table.guestSessionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("rev_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("rev_worker_idx").using(
      "btree",
      table.workerId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.workerId],
      foreignColumns: [workers.userId],
      name: "reviews_worker_id_workers_user_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "reviews_user_id_users_id_fk",
    }),
    foreignKey({
      columns: [table.guestSessionId],
      foreignColumns: [guestSessions.id],
      name: "reviews_guest_session_id_guest_sessions_id_fk",
    }),
    foreignKey({
      columns: [table.appointmentId],
      foreignColumns: [appointments.id],
      name: "reviews_appointment_id_appointments_id_fk",
    }),
  ],
);

export const chatEvents = pgTable(
  "chat_events",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversation_id").notNull(),
    kind: chatEventKind().notNull(),
    appointmentId: uuid("appointment_id"),
    reviewId: uuid("review_id"),
    blurb: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    senderId: uuid("sender_id"),
    startTime: timestamp("start_time", { mode: "string" }),
    endTime: timestamp("end_time", { mode: "string" }),
  },
  (table) => [
    index("chat_evt_conv_idx").using(
      "btree",
      table.conversationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("chat_evt_kind_idx").using(
      "btree",
      table.kind.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: "chat_events_conversation_id_conversations_id_fk",
    }),
    foreignKey({
      columns: [table.appointmentId],
      foreignColumns: [appointments.id],
      name: "chat_events_appointment_id_appointments_id_fk",
    }),
    foreignKey({
      columns: [table.reviewId],
      foreignColumns: [reviews.id],
      name: "chat_events_review_id_reviews_id_fk",
    }),
  ],
);

export const workers = pgTable(
  "workers",
  {
    userId: uuid("user_id").notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    skill: varchar({ length: 255 }).notNull(),
    category: varchar({ length: 255 }).notNull(),
    rating: integer().default(0).notNull(),
    profileImageUrl: text("profile_image_url").notNull(),
    description: text().notNull(),
    hourlyRate: integer("hourly_rate").notNull(),
    location: text(),
    availability: jsonb().default({ weekly: [], exceptions: [] }).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
  },
  (table) => [
    index("skill_idx").using(
      "btree",
      table.skill.asc().nullsLast().op("text_ops"),
    ),
    index("worker_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "workers_user_id_users_id_fk",
    }),
    unique("workers_user_id_unique").on(table.userId),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workerId: uuid("worker_id").notNull(),
    userId: uuid("user_id"),
    guestSessionId: uuid("guest_session_id"),
    guestEmail: varchar("guest_email", { length: 255 }),
    guestPhone: varchar("guest_phone", { length: 20 }),
    startTime: timestamp("start_time", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    endTime: timestamp("end_time", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    status: appointmentStatus().default("REQUESTED"),
    notes: text(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    index("app_date_idx").using(
      "btree",
      table.startTime.asc().nullsLast().op("timestamptz_ops"),
      table.endTime.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("app_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("app_worker_idx").using(
      "btree",
      table.workerId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.workerId],
      foreignColumns: [workers.userId],
      name: "appointments_worker_id_workers_user_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "appointments_user_id_users_id_fk",
    }),
    foreignKey({
      columns: [table.guestSessionId],
      foreignColumns: [guestSessions.id],
      name: "appointments_guest_session_id_guest_sessions_id_fk",
    }),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    profileImageUrl: text("profile_image_url"),
    status: userStatus().default("PENDING"),
    role: userRole().default("USER"),
    lastActivityAt: timestamp("last_activity_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    index("email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    unique("users_email_unique").on(table.email),
  ],
);

export const guestSessions = pgTable("guest_sessions", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  fullName: varchar("full_name", { length: 255 }).default("Invité"),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    workerId: uuid("worker_id"),
    userId: uuid("user_id"),
    guestSessionId: uuid("guest_session_id"),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("conv_guest_idx").using(
      "btree",
      table.guestSessionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("conv_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("conv_worker_idx").using(
      "btree",
      table.workerId.asc().nullsLast().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.workerId],
      foreignColumns: [workers.userId],
      name: "conversations_worker_id_workers_user_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "conversations_user_id_users_id_fk",
    }),
    foreignKey({
      columns: [table.guestSessionId],
      foreignColumns: [guestSessions.id],
      name: "conversations_guest_session_id_guest_sessions_id_fk",
    }),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    conversationId: uuid("conversation_id").notNull(),
    content: text().notNull(),
    senderType: varchar("sender_type", { length: 10 }).notNull(),
    senderId: uuid("sender_id"),
    guestSessionId: uuid("guest_session_id"),
    receiverId: uuid("receiver_id"),
    status: messageStatus().default("SENT"),
    readAt: timestamp("read_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("msg_conversation_idx").using(
      "btree",
      table.conversationId.asc().nullsLast().op("uuid_ops"),
    ),
    index("msg_guest_idx").using(
      "btree",
      table.guestSessionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("msg_receiver_idx").using(
      "btree",
      table.receiverId.asc().nullsLast().op("uuid_ops"),
    ),
    index("msg_sender_idx").using(
      "btree",
      table.senderId.asc().nullsLast().op("uuid_ops"),
    ),
    index("msg_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversations.id],
      name: "messages_conversation_id_conversations_id_fk",
    }),
    foreignKey({
      columns: [table.guestSessionId],
      foreignColumns: [guestSessions.id],
      name: "messages_guest_session_id_guest_sessions_id_fk",
    }),
  ],
);

export const workerSkills = pgTable(
  "worker_skills",
  {
    workerId: uuid("worker_id").notNull(),
    skill: varchar({ length: 255 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.workerId],
      foreignColumns: [workers.userId],
      name: "worker_skills_worker_id_workers_user_id_fk",
    }),
    primaryKey({
      columns: [table.workerId, table.skill],
      name: "worker_skills_worker_id_skill_pk",
    }),
  ],
);
