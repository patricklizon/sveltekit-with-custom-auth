import type {
	UserHashedOTP,
	UserHashedPassword,
	UserPlainTextOTP,
	UserPlainTextPassword
} from '$lib/shared/domain/__core/user';
import { safeCastId } from '$lib/shared/domain/__core/id';
import { Argon2id } from 'oslo/password';

/**
 * Provides methods for hashing and verifying passwords using the Argon2id algorithm.
 * Uses domain types for better type safety.
 *
 */

export class PasswordHasher {
	constructor(private hasher = new Argon2id()) {}

	async hash(password: UserPlainTextPassword): Promise<UserHashedPassword>;
	async hash(password: UserPlainTextOTP): Promise<UserHashedOTP>;
	async hash(
		password: UserPlainTextPassword | UserPlainTextOTP
	): Promise<UserHashedPassword | UserHashedOTP> {
		const hashedPassword: UserHashedPassword | UserHashedOTP = safeCastId(
			await this.hasher.hash(password)
		);
		return hashedPassword;
	}

	async verify(
		userHashedPassword: UserHashedPassword,
		password: UserPlainTextPassword
	): Promise<boolean>;
	async verify(userHashedPassword: UserHashedOTP, password: UserPlainTextOTP): Promise<boolean>;
	async verify(
		userHashedPassword: UserHashedPassword | UserHashedOTP,
		password: UserPlainTextPassword | UserPlainTextOTP
	): Promise<boolean> {
		return this.hasher.verify(userHashedPassword, password);
	}
}
