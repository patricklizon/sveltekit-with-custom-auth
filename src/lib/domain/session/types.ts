import type { Id } from '../id';

import { sessions } from '$lib/server/infrastructure/persistance/schemas';

export type SessionDBSelectModel = typeof sessions.$inferSelect;
export type SessionDBInsertModel = typeof sessions.$inferInsert;

export type SessionId = Id<'session-id'>;
export type SessionToken = Id<'session-token'>;

export type Session = Omit<SessionDBSelectModel, 'createdAt'>;
