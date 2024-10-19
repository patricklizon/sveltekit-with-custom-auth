import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { SessionId } from '../../../../../domain/session';
import type { UserId } from '../../../../../domain/user';
import { sqlDefaultCreatedAt } from '../../utils';

import { users } from './users';

export const sessions = sqliteTable('sessions', {
	id: text().notNull().primaryKey().$type<SessionId>(),
	createdAt: integer({ mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	userId: text()
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	expiresAt: integer({ mode: 'timestamp_ms' }).notNull(),
	isTwoFactorVerified: integer({ mode: 'boolean' }).notNull()
});

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));
