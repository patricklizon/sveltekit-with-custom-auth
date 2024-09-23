import type { UserHashedPassword, UserPlainTextPassword } from '$lib/shared/domain/__core/user';
import { safeCastId } from '$lib/shared/domain/__core/id';
import { Argon2id } from 'oslo/password';

export interface IPasswordHasher {
	hash(password: UserPlainTextPassword): Promise<UserHashedPassword>;
	verify(UserHashedPassword: UserHashedPassword, password: UserPlainTextPassword): Promise<boolean>;
}

/**
 * Provides methods for hashing and verifying passwords using the Argon2id algorithm.
 * Uses domain types for better type safety.
 *
 */

export class PasswordHasher implements IPasswordHasher {
	constructor(private hasher = new Argon2id()) {}

	async hash(password: UserPlainTextPassword): Promise<UserHashedPassword> {
		const UserHashedPassword: UserHashedPassword = safeCastId(await this.hasher.hash(password));
		return UserHashedPassword;
	}

	async verify(
		UserHashedPassword: UserHashedPassword,
		password: UserPlainTextPassword
	): Promise<boolean> {
		return this.hasher.verify(UserHashedPassword, password);
	}
}
