import { err, ok, ResultAsync } from 'neverthrow';

import { safeCastId } from '$lib/domain/id';
import {
	UserCorruptionError,
	UserDoesNotExistsError,
	UserInvalidPasswordError,
	type UserPlainTextPassword,
	type User
} from '$lib/domain/user';
import { UnexpectedError } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import type { SessionService } from '$lib/server/infrastructure/session';
import { UserRepository } from '$lib/server/infrastructure/user';
import type { Cookies, Option } from '$lib/types';

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
		private hasher: PasswordHashingService,
		private sessionService: SessionService,
		private userRepository: UserRepository
	) {}

	async execute(ctx: UseCaseContext, input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const user = await this.userRepository.findByEmail({ email: input.email });
			if (!user) {
				await this.simulatePasswordVerification();
				return err(new UserDoesNotExistsError(input.email));
			}

			const password = await this.userRepository.findUserPasswordById({ userId: user.id });
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

			// TODO: verify signature
			const { token, session } = await this.sessionService.create(user.id, {
				isTwoFactorVerified: false
			});
			// TODO: verify
			this.sessionService.setSessionTokenCookie(ctx.cookies, token, session.expiresAt);
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
