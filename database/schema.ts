/* ------------------------------------------------------------------
   DRIZZLE ORM — schéma complet (clé partagée users/workers)
   ----------------------------------------------------------------- */
import {
  uuid,
  varchar,
  text,
  timestamp,
  pgTable,
  integer,
  pgEnum,
  jsonb,
  index,
  primaryKey,
  doublePrecision,
  unique,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ================ ENUMS ================ */
export const USER_STATUS = pgEnum("user_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
]);

export const USER_ROLE = pgEnum("user_role", ["USER", "ADMIN", "HELPR"]);

export const MESSAGE_STATUS = pgEnum("message_status", [
  "SENT",
  "DELIVERED",
  "READ",
]);

export const APPOINTMENT_STATUS = pgEnum("appointment_status", [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export const CHAT_EVENT_KIND = pgEnum("chat_event_kind", [
  "appointment_requested",
  "appointment_cancelled",
  "appointment_confirmed",
  "appointment_completed",
  "appointment_archived",
  "review_requested",
  "review_confirmed",
]);

export const RECEIVER_TYPE = pgEnum("receiver_type", [
  "guest",
  "user",
  "worker",
]);

/* ================ TABLES ================ */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    full_name: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password_hash: text("password_hash"),
    profile_image_url: text("profile_image_url"),
    status: USER_STATUS("status").default("PENDING"),
    role: USER_ROLE("role").default("USER"),
    last_activity_at: timestamp("last_activity_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    email_idx: index("users_email_idx").on(t.email),
    status_idx: index("users_status_idx").on(t.status),
  }),
);

/* 1 ligne = le même UUID que dans users.id */
export const workers = pgTable(
  "workers",
  {
    id: uuid("user_id") // PK = FK → users
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),

    full_name: varchar("full_name", { length: 255 }).notNull(),
    skill: varchar("skill", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    rating: integer("rating").notNull().default(0),
    profile_image_url: text("profile_image_url").notNull(),
    description: text("description").notNull(),
    hourly_rate: integer("hourly_rate").notNull(),
    location: text("location"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    availability: jsonb("availability")
      .notNull()
      .default(JSON.stringify({ weekly: [], exceptions: [] })),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    skill_idx: index("workers_skill_idx").on(t.skill),
  }),
);

export const guest_sessions = pgTable("guest_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  full_name: varchar("full_name", { length: 255 }).default("Invité"),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    worker_id: uuid("worker_id").references(() => workers.id, {
      onDelete: "cascade",
    }),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    guest_session_id: uuid("guest_session_id").references(
      () => guest_sessions.id,
      { onDelete: "cascade" },
    ),
    last_message_at: timestamp("last_message_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    worker_idx: index("conv_worker_idx").on(t.worker_id),
    user_idx: index("conv_user_idx").on(t.user_id),
    guest_idx: index("conv_guest_idx").on(t.guest_session_id),
  }),
);

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const guestPushTokens = pgTable("guest_push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  guestSessionId: uuid("guest_session_id").notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    sender_type: varchar("sender_type", { length: 10 }).notNull(),
    sender_id: uuid("sender_id"),
    guest_session_id: uuid("guest_session_id").references(
      () => guest_sessions.id,
      { onDelete: "cascade" },
    ),
    receiver_id: uuid("receiver_id"),
    status: MESSAGE_STATUS("status").default("SENT"),
    read_at: timestamp("read_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    conversation_idx: index("msg_conv_idx").on(t.conversation_id),
    sender_idx: index("msg_sender_idx").on(t.sender_id),
    guest_idx: index("msg_guest_idx").on(t.guest_session_id),
  }),
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    worker_id: uuid("worker_id")
      .references(() => workers.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    guest_session_id: uuid("guest_session_id").references(
      () => guest_sessions.id,
      { onDelete: "cascade" },
    ),

    initiator: varchar("initiator", { length: 6 }).notNull().default("user"),

    guest_email: varchar("guest_email", { length: 255 }),
    guest_phone: varchar("guest_phone", { length: 20 }),
    start_time: timestamp("start_time", { withTimezone: true }).notNull(),
    end_time: timestamp("end_time", { withTimezone: true }).notNull(),
    status: APPOINTMENT_STATUS("status").default("REQUESTED"),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => ({
    worker_idx: index("app_worker_idx").on(t.worker_id),
    user_idx: index("app_user_idx").on(t.user_id),
    date_range_idx: index("app_date_idx").on(t.start_time, t.end_time),
  }),
);
/* ➜ index UNIQUE filtré (worker_id,start_time,end_time) à créer via migration */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointment_id: uuid("appointment_id")
      .references(() => appointments.id, { onDelete: "cascade" })
      .notNull(),
    worker_id: uuid("worker_id")
      .references(() => workers.id, { onDelete: "cascade" })
      .notNull(),
    user_id: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    guest_session_id: uuid("guest_session_id").references(
      () => guest_sessions.id,
      { onDelete: "cascade" },
    ),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    tags: text("tags").array(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    worker_idx: index("rev_worker_idx").on(t.worker_id),
    onePerAppointment: unique().on(t.appointment_id),
  }),
);

export const chat_events = pgTable(
  "chat_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),

    kind: CHAT_EVENT_KIND("kind").notNull(),

    appointment_id: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "cascade",
    }),
    review_id: uuid("review_id").references(() => reviews.id, {
      onDelete: "cascade",
    }),

    sender_id: uuid("sender_id"),
    start_time: timestamp("start_time", { withTimezone: true }),
    end_time: timestamp("end_time", { withTimezone: true }),
    blurb: text("blurb"),
    payload: jsonb("payload"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    conv_idx: index("chat_evt_conv_idx").on(t.conversation_id),
    kind_idx: index("chat_evt_kind_idx").on(t.kind),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    receiverType: RECEIVER_TYPE("receiver_type").notNull(),
    receiverId: uuid("receiver_id"),
    guestSessionId: uuid("guest_session_id"),
    senderName: text("sender_name"),
    senderAvatar: text("sender_avatar"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    link: text("link"),
    read: boolean("read").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    receiver_idx: index("notif_receiver_idx").on(
      t.receiverType,
      t.receiverId,
      t.guestSessionId,
    ),
  }),
);

export const worker_skills = pgTable(
  "worker_skills",
  {
    worker_id: uuid("worker_id")
      .references(() => workers.id, { onDelete: "cascade" })
      .notNull(),
    skill: varchar("skill", { length: 255 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.worker_id, t.skill] }),
  }),
);

/* ================ RELATIONS inchangées ================ */
/* … tes blocs relations restent identiques … */

/* ================= RELATIONS ================= */
export const usersRelations = relations(users, ({ one, many }) => ({
  worker_profile: one(workers, {
    fields: [users.id],
    references: [workers.id],
  }),
  conversations: many(conversations, { relationName: "user_conversations" }),
  sent_messages: many(messages, { relationName: "user_messages" }),
  appointments: many(appointments, { relationName: "user_appointments" }),
  reviews: many(reviews),
}));

export const workersRelations = relations(workers, ({ one, many }) => ({
  user: one(users, { fields: [workers.id], references: [users.id] }),
  conversations: many(conversations),
  appointments: many(appointments),
  received_messages: many(messages, { relationName: "worker_messages" }),
  reviews: many(reviews),
}));

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [appointments.user_id],
      references: [users.id],
      relationName: "user_appointments",
    }),
    worker: one(workers, {
      fields: [appointments.worker_id],
      references: [workers.id],
    }),
    guestSession: one(guest_sessions, {
      fields: [appointments.guest_session_id],
      references: [guest_sessions.id],
    }),
    chatEvents: many(chat_events),
  }),
);

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  worker: one(workers, {
    fields: [reviews.worker_id],
    references: [workers.id],
  }),
  user: one(users, { fields: [reviews.user_id], references: [users.id] }),
  guestSession: one(guest_sessions, {
    fields: [reviews.guest_session_id],
    references: [guest_sessions.id],
  }),
  chatEvents: many(chat_events),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    worker: one(workers, {
      fields: [conversations.worker_id],
      references: [workers.id],
    }),
    user: one(users, {
      fields: [conversations.user_id],
      references: [users.id],
      relationName: "user_conversations",
    }),
    guestSession: one(guest_sessions, {
      fields: [conversations.guest_session_id],
      references: [guest_sessions.id],
    }),
    messages: many(messages),
    chatEvents: many(chat_events),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
  userSender: one(users, {
    fields: [messages.sender_id],
    references: [users.id],
    relationName: "user_messages",
  }),
  workerSender: one(workers, {
    fields: [messages.sender_id],
    references: [workers.id],
    relationName: "worker_messages",
  }),
  guestSession: one(guest_sessions, {
    fields: [messages.guest_session_id],
    references: [guest_sessions.id],
  }),
}));

export const chatEventsRelations = relations(chat_events, ({ one }) => ({
  conversation: one(conversations, {
    fields: [chat_events.conversation_id],
    references: [conversations.id],
  }),
  appointment: one(appointments, {
    fields: [chat_events.appointment_id],
    references: [appointments.id],
  }),
  review: one(reviews, {
    fields: [chat_events.review_id],
    references: [reviews.id],
  }),
}));

export const guestSessionsRelations = relations(guest_sessions, ({ many }) => ({
  conversations: many(conversations),
  messages: many(messages),
  reviews: many(reviews),
}));
