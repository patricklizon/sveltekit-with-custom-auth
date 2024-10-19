import { relations } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

import { createId } from '../../../../../domain/id';
import type { UserHashedOTP, UserId } from '../../../../../domain/user';
import type { UserRequestId, UserRequestType } from '../../../../../domain/user-request';
import { sqlDefaultCreatedAt } from '../../utils';

import { users } from './users';

export const userRequests = sqliteTable('user_request', {
	id: text().notNull().primaryKey().$default(createId).$type<UserRequestId>(),
	userId: text()
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	// TODO: add strong type to suer request type
	type: text().notNull().$type<UserRequestType>(),
	// TODO: add type -> .$type<UserRequestType>(),
	hashedOTP: text().notNull().$type<UserHashedOTP>(),
	expiresAt: integer({ mode: 'timestamp' }).notNull(),
	createdAt: integer({ mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	confirmedAt: integer({ mode: 'timestamp' })
});

export const userRequestsRelations = relations(userRequests, ({ one }) => ({
	user: one(users, {
		fields: [userRequests.userId],
		references: [users.id]
	})
}));
