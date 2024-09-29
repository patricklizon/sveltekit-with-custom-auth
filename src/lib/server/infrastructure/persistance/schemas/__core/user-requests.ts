import type { UserHashedOTP, UserId } from '../../../../../shared/domain/__core/user';
import type { UserRequestId } from '../../../../../shared/domain/__core/user-request';

import { createId } from '../../../../../shared/domain/__core/id';
import { relations } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

import { sqlDefaultCreatedAt } from '../../utils';
import { users } from './users';

export const userRequests = sqliteTable('user_request', {
	id: text('id').notNull().primaryKey().$default(createId).$type<UserRequestId>(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	// TODO: add strong type
	type: text('type').notNull(),
	// TODO: add type -> .$type<UserRequestType>(),
	hashedOTP: text('hashed_otp').notNull().$type<UserHashedOTP>(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	confirmedAt: integer('confirmed_at', { mode: 'timestamp' })
});

export const userRequestsRelations = relations(userRequests, ({ one }) => ({
	user: one(users, {
		fields: [userRequests.userId],
		references: [users.id]
	})
}));
