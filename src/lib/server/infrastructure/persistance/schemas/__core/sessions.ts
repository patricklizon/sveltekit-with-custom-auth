import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { SessionId } from '../../../../../domain/session';
import type { UserId } from '../../../../../domain/user';
import { sqlDefaultCreatedAt } from '../../utils';

import { users } from './users';

export const sessions = sqliteTable('sessions', {
	id: text('id').notNull().primaryKey().$type<SessionId>(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
	isTwoFactorVerified: integer('is_two_factor_verified', { mode: 'boolean' }).notNull()
});

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));
