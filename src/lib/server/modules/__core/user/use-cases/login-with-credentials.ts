import { err, ok, ResultAsync } from 'neverthrow';

import { UserRepository } from '../repository';

import { UnexpectedError } from '$lib/errors';
import type {
	Cookies,
	PasswordHasher,
	CookieSessionManager
} from '$lib/server/infrastructure/__core/security';
import { database } from '$lib/server/infrastructure/persistance';
import { safeCastId } from '$lib/shared/domain/__core/id';
import {
	UserCorruptionError,
	UserDoesNotExistsError,
	UserInvalidPasswordError,
	type UserPlainTextPassword,
	type User
} from '$lib/shared/domain/__core/user';
import type { Option } from '$lib/types';

type UseCaseContext = {
	cookies: Cookies;
	ip: Option<string>;
	userAgent: string;
};

type UseCaseInput = Readonly<{
	email: User['email'];
	password: UserPlainTextPassword;
}>;

type UseCaseResult = ResultAsync<
	Readonly<User>,
	UserInvalidPasswordError | UserDoesNotExistsError | UserCorruptionError | UnexpectedError
>;

export class LoginWithCredentialsUseCase {
	constructor(
		private hasher: PasswordHasher,
		private cookieSessionManager: CookieSessionManager,
		private db = database
	) {}

	async execute(ctx: UseCaseContext, input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const userRepository = new UserRepository(this.hasher, this.db);
			const user = await userRepository.findByEmail(input.email);
			if (!user) {
				await this.simulatePasswordVerification();
				return err(new UserDoesNotExistsError(input.email));
			}

			const password = await userRepository.findUserPasswordById(user.id);
			if (!password) {
				await this.simulatePasswordVerification();
				return err(
					new UserCorruptionError('User found but password not found', { email: user.email })
				);
			}

			const isPasswordValid = await this.hasher.verify(password.hashedPassword, input.password);
			if (!isPasswordValid) {
				// TODO: add record to DB that stores number of attempts
				// or should it be done with rate limiter?
				// - update user's event log -> ip, userAgent
				// - send email notification

				return err(new UserInvalidPasswordError());
			}

			await this.cookieSessionManager.create(ctx.cookies, user.id);
			// TODO: user log -> ip, userAgent

			return ok(user);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}

	/**
	 * Mitigates timing attacks by hashing password even when the user does not exists
	 */
	private async simulatePasswordVerification(): Promise<void> {
		const dummyHash = await this.hasher.hash(
			safeCastId<UserPlainTextPassword, string>('dummy_hash')
		);
		const dummyPassword = safeCastId<UserPlainTextPassword, string>('dummy_password');
		await this.hasher.verify(dummyHash, dummyPassword);
	}
}
