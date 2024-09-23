import type {
	UserHashedPassword,
	ExternalAccountProviderId,
	UserExternalAccountId,
	UserId
} from '../../../../../shared/domain/__core/user';
import { createId } from '../../../../../shared/domain/__core/id';

import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sqlDefaultCreatedAt, sqlDefaultUpdatedAt } from '../../utils';

/**
 * Users of the application
 */
export const users = sqliteTable(
	'user',
	{
		id: text('id').notNull().primaryKey().$type<UserId>(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$default(sqlDefaultCreatedAt)
			.$onUpdate(sqlDefaultUpdatedAt),
		deletedAt: integer('deleted_at', { mode: 'timestamp' }),
		email: text('email').notNull().unique(),
		emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
		twoFactorAuthenticationEnabled: integer('two_factor_authentication_enabled', {
			mode: 'boolean'
		})
			.notNull()
			.default(false)
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
	emailChanges: many(emailChangesRequests),
	passwordResets: many(passwordResetRequests)
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
	lastChangedAt: integer('created_at', { mode: 'timestamp' })
});

export const usersPasswordsRelations = relations(userPasswords, ({ one }) => ({
	user: one(users, {
		fields: [userPasswords.userId],
		references: [users.id]
	})
}));

/**
 * Token for password reset flow
 */
export const passwordResetRequests = sqliteTable('password_reset_request', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	/** For non-2FA users */
	token: text('token').notNull().unique(),
	/** For 2FA users */
	otp: text('otp'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	usedAt: integer('used_at', { mode: 'timestamp' })
});

export const passwordResetRequestsRelations = relations(passwordResetRequests, ({ one }) => ({
	user: one(users, {
		fields: [passwordResetRequests.userId],
		references: [users.id]
	})
}));

export const emailChangesRequests = sqliteTable('email_change_request', {
	id: text('id').notNull().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	newEmail: text('new_email').notNull(),
	/** For non-2FA users */
	token: text('token').notNull().unique(),
	/** For 2FA users */
	otp: text('otp'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	verifiedAt: integer('verified_at', { mode: 'timestamp' })
});

export const emailChangesRelations = relations(emailChangesRequests, ({ one }) => ({
	user: one(users, {
		fields: [emailChangesRequests.userId],
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
		id: text('id')
			.primaryKey()
			.notNull()
			.$default(() => createId())
			.$type<UserExternalAccountId>(),
		userId: text('user_id')
			.references(() => users.id)
			.$type<UserId>(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$default(sqlDefaultCreatedAt)
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
