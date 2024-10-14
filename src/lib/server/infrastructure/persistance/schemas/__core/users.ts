import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { createId } from '../../../../../domain/id';
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
		id: text('id').notNull().primaryKey().$default(createId).$type<UserId>(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$default(sqlDefaultCreatedAt)
			.$onUpdate(sqlDefaultUpdatedAt),
		deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
		email: text('email').notNull().unique(),
		isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).notNull().default(false),
		isTTOPEnabled: integer('is_ttop_enabled', { mode: 'boolean' }).notNull().default(false),
		isPasskeyEnabled: integer('is_passkey_enabled', { mode: 'boolean' }).notNull().default(false),
		isSecurityKeyEnabled: integer('is_security_key_enabled', { mode: 'boolean' })
			.notNull()
			.default(false),
		is2FAEnabled: integer('is_2fa_enabled', { mode: 'boolean' }).notNull().default(false)
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
	userId: text('user_id')
		.primaryKey()
		.references(() => users.id)
		.$type<UserId>(),
	hashedPassword: text('hashed_password').notNull().$type<UserHashedPassword>(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$default(sqlDefaultCreatedAt),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$onUpdate(sqlDefaultUpdatedAt)
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
		id: text('id').primaryKey().notNull().$default(createId).$type<UserExternalAccountId>(),
		userId: text('user_id')
			.references(() => users.id)
			.$type<UserId>(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$onUpdate(sqlDefaultUpdatedAt),
		providerId: text('provider_id').notNull().$type<ExternalAccountProviderId>(),
		providerUserId: text('provider_user_id').notNull().$type<UserExternalAccountId>()
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
