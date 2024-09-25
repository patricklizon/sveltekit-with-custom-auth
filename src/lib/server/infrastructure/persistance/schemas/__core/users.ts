import type {
	UserHashedPassword,
	ExternalAccountProviderId,
	UserExternalAccountId,
	UserId,
	UserPasswordResetRequestId
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
		id: text('id').notNull().primaryKey().$default(createId).$type<UserId>(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$onUpdate(sqlDefaultUpdatedAt),
		deletedAt: integer('deleted_at', { mode: 'timestamp' }),
		email: text('email').notNull().unique(),
		emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
		twoFactorEnabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
		twoFactorVerified: integer('verified', { mode: 'boolean' }).notNull().default(false)
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
	emailChangeRequestss: many(userEmailChangesRequests),
	passwordResetRequestss: many(userPasswordResetRequests)
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
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdate(sqlDefaultUpdatedAt)
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
export const userPasswordResetRequests = sqliteTable('user_password_reset_request', {
	id: text('id').notNull().primaryKey().$default(createId).$type<UserPasswordResetRequestId>(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	otp: text('otp').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
	verifiedAt: integer('verified_at', { mode: 'timestamp' })
});

export const userPasswordResetRequestsRelations = relations(
	userPasswordResetRequests,
	({ one }) => ({
		user: one(users, {
			fields: [userPasswordResetRequests.userId],
			references: [users.id]
		})
	})
);

export const userEmailChangesRequests = sqliteTable('user_email_change_request', {
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

export const userEmailChangesRelations = relations(userEmailChangesRequests, ({ one }) => ({
	user: one(users, {
		fields: [userEmailChangesRequests.userId],
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
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(sqlDefaultCreatedAt),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
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
