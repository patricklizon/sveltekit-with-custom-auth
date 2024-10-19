import type { Id } from '$lib/domain/id';
import type { users, userPasswords } from '$lib/server/infrastructure/persistance';

/* USER */

export type UserId = Id<'user-id'>;

export type UserDBSelectModel = typeof users.$inferSelect;

export type User = Omit<UserDBSelectModel, 'createdAt' | 'updatedAt' | 'deletedAt'>;

/* USER PASSWORD */

export type UserPasswordsDBSelectModel = typeof userPasswords.$inferSelect;
export type UserPasswordsDBInsertModel = typeof userPasswords.$inferInsert;

export type UserPlainTextPassword = Id<'user-plain-text-password'>;
export type UserHashedPassword = Id<'user-hashed-password'>;

export type UserPlainTextOTP = Id<'user-plain-text-otp'>;
export type UserHashedOTP = Id<'user-hashed-otp'>;
export type UserRecoveryCode = Id<'user-hashed-otp'>;

/* USER EXTERNAL ACCOUNT */

export type UserExternalAccountId = Id<'user-external-account-id'>;
export type ExternalAccountProviderId = Id<'user-external-account-provider-id'>;
