import { relations } from "drizzle-orm/relations";
import { workers, reviews, users, guestSessions, appointments, conversations, chatEvents, messages, workerSkills } from "./schema";

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	worker: one(workers, {
		fields: [reviews.workerId],
		references: [workers.userId]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	guestSession: one(guestSessions, {
		fields: [reviews.guestSessionId],
		references: [guestSessions.id]
	}),
	appointment: one(appointments, {
		fields: [reviews.appointmentId],
		references: [appointments.id]
	}),
	chatEvents: many(chatEvents),
}));

export const workersRelations = relations(workers, ({one, many}) => ({
	reviews: many(reviews),
	user: one(users, {
		fields: [workers.userId],
		references: [users.id]
	}),
	appointments: many(appointments),
	conversations: many(conversations),
	workerSkills: many(workerSkills),
}));

export const usersRelations = relations(users, ({many}) => ({
	reviews: many(reviews),
	workers: many(workers),
	appointments: many(appointments),
	conversations: many(conversations),
}));

export const guestSessionsRelations = relations(guestSessions, ({many}) => ({
	reviews: many(reviews),
	appointments: many(appointments),
	conversations: many(conversations),
	messages: many(messages),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	reviews: many(reviews),
	chatEvents: many(chatEvents),
	worker: one(workers, {
		fields: [appointments.workerId],
		references: [workers.userId]
	}),
	user: one(users, {
		fields: [appointments.userId],
		references: [users.id]
	}),
	guestSession: one(guestSessions, {
		fields: [appointments.guestSessionId],
		references: [guestSessions.id]
	}),
}));

export const chatEventsRelations = relations(chatEvents, ({one}) => ({
	conversation: one(conversations, {
		fields: [chatEvents.conversationId],
		references: [conversations.id]
	}),
	appointment: one(appointments, {
		fields: [chatEvents.appointmentId],
		references: [appointments.id]
	}),
	review: one(reviews, {
		fields: [chatEvents.reviewId],
		references: [reviews.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	chatEvents: many(chatEvents),
	worker: one(workers, {
		fields: [conversations.workerId],
		references: [workers.userId]
	}),
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
	guestSession: one(guestSessions, {
		fields: [conversations.guestSessionId],
		references: [guestSessions.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	guestSession: one(guestSessions, {
		fields: [messages.guestSessionId],
		references: [guestSessions.id]
	}),
}));

export const workerSkillsRelations = relations(workerSkills, ({one}) => ({
	worker: one(workers, {
		fields: [workerSkills.workerId],
		references: [workers.userId]
	}),
}));