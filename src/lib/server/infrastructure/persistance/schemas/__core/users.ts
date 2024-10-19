import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createId } from '../../../../../domain/id';
import type { Language } from '../../../../../domain/language';
import type { TimeZone } from '../../../../../domain/time';
import type {
	UserHashedPassword,
	ExternalAccountProviderId,
	UserExternalAccountId,
	UserId
} from '../../../../../domain/user';
import { sqlDefaultCreatedAt, sqlDefaultUpdatedAt } from '../../utils';

import { userRequests } from './user-requests';

/**
 * Users of the application
 */
export const users = sqliteTable(
	'user',
	{
		id: text().notNull().primaryKey().$default(createId).$type<UserId>(),
		createdAt: integer({ mode: 'timestamp_ms' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer({ mode: 'timestamp_ms' })
			.notNull()
			.$default(sqlDefaultCreatedAt)
			.$onUpdate(sqlDefaultUpdatedAt),
		deletedAt: integer({ mode: 'timestamp_ms' }),
		preferredTimeZone: text().$type<TimeZone>(),
		preferredLanguage: text().$type<Language>(),
		email: text().notNull().unique(),
		isEmailVerified: integer({ mode: 'boolean' }).notNull().default(false),
		isTTOPEnabled: integer({ mode: 'boolean' }).notNull().default(false),
		isPasskeyEnabled: integer({ mode: 'boolean' }).notNull().default(false),
		isSecurityKeyEnabled: integer({ mode: 'boolean' }).notNull().default(false),
		is2FAEnabled: integer({ mode: 'boolean' }).notNull().default(false)
	},
	(table) => ({
		emailIdx: index('email_idx').on(table.email)
	})
);

export const usersRelations = relations(users, ({ one, many }) => ({
	userPasswords: one(userPasswords, {
		fields: [users.id],
		references: [userPasswords.userId]
	}),
	externalAccounts: many(userExternalAccounts),
	requests: many(userRequests)
}));

/**
 * Credentials for login with email
 */
export const userPasswords = sqliteTable('user_password', {
	userId: text()
		.primaryKey()
		.references(() => users.id)
		.$type<UserId>(),
	hashedPassword: text().notNull().$type<UserHashedPassword>(),
	createdAt: integer({ mode: 'timestamp_ms' }).notNull().$default(sqlDefaultCreatedAt),
	updatedAt: integer({ mode: 'timestamp_ms' }).notNull().$onUpdate(sqlDefaultUpdatedAt)
});

export const usersPasswordsRelations = relations(userPasswords, ({ one }) => ({
	user: one(users, {
		fields: [userPasswords.userId],
		references: [users.id]
	})
}));

/**
 * External accounts used to identify users.
 * i.e. github, gitlab, atlasian
 */
export const userExternalAccounts = sqliteTable(
	'user_external_account',
	{
		id: text().primaryKey().notNull().$default(createId).$type<UserExternalAccountId>(),
		userId: text()
			.references(() => users.id)
			.$type<UserId>(),
		createdAt: integer({ mode: 'timestamp_ms' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer({ mode: 'timestamp_ms' }).notNull().$onUpdate(sqlDefaultUpdatedAt),
		providerId: text().notNull().$type<ExternalAccountProviderId>(),
		providerUserId: text().notNull().$type<UserExternalAccountId>()
	},
	(table) => ({
		idIdx: uniqueIndex('id_idx').on(table.id),
		userIdIdx: index('user_id_idx').on(table.userId),
		providerIdIdx: index('provider_id_idx').on(table.providerId)
	})
);

export const userExternalAccountsRelations = relations(userExternalAccounts, ({ one }) => ({
	user: one(users, {
		fields: [userExternalAccounts.userId],
		references: [users.id]
	})
}));
