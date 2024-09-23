import type { Id } from '$lib/shared/domain/__core/id';
import type { users, userPasswords } from '$lib/server/infrastructure/persistance';

/* USER */

export type { User as AuthenticatedUser } from 'lucia';

export type UserId = Id<'user-id'>;

export type UserDBSelectModel = typeof users.$inferSelect;
export type UserDBInsertModel = typeof users.$inferInsert;

export type User = Omit<UserDBSelectModel, 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type UserUpdateDTO = Omit<Partial<User>, 'id' | 'twoFactorEnabled'>;

/* USER PASSWORD */

export type UserPasswordsDBSelectModel = typeof userPasswords.$inferSelect;
export type UserPasswordsDBInsertModel = typeof userPasswords.$inferInsert;

export type UserPlainTextPassword = Id<'user-plain-text-password'>;

export type UserHashedPassword = Id<'user-hashed-password'>;

export type UserCredentials = Pick<UserPasswordsDBSelectModel, 'hashedPassword'>;

export type UserCredentialsUpdateDTO = UserCredentials;

/* USER EXTERNAL ACCOUNT */

export type UserExternalAccountId = Id<'user-external-account-id'>;
export type ExternalAccountProviderId = Id<'user-external-account-provider-id'>;

/* LOGIN */

export type UserLoginWithCredentialsFormData = Readonly<{
	email: User['email'];
	password: UserPlainTextPassword;
}>;

/* REGISTER */

export type UserRegisterWithCredentialsFormData = Readonly<{
	email: User['email'];
	password: UserPlainTextPassword;
	passwordConfirmation: UserPlainTextPassword;
}>;

/* CHANGE */

export type UserChangeEmailDTO = Readonly<{
	currentEmail: User['email'];
	nextEmail: User['email'];
	nextEmailConfirmation: User['email'];
}>;
