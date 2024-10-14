import { err, ok, Result } from 'neverthrow';

import { UserDoesNotExistsError, UserEmailAlreadyVerifiedError, type User } from '$lib/domain/user';
import { UnexpectedError } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database, safeTxRollback } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';

type UseCaseInput = Readonly<{
	userId: User['id'];
}>;

type UseCaseResult = Result<
	true,
	UserDoesNotExistsError | UserEmailAlreadyVerifiedError | UnexpectedError
>;

export class ConfirmEmailUseCase {
	constructor(
		private hasher: PasswordHashingService,
		private db = database
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRepository = new UserRepository(this.hasher, tx);
				const user = await userRepository.findById(input.userId);

				if (!user) {
					safeTxRollback(tx);
					return err(new UserEmailAlreadyVerifiedError(input.userId));
				}

				if (user.isEmailVerified) {
					safeTxRollback(tx);
					return err(new UnexpectedError('Email already verified'));
				}

				userRepository.setEmailAsVerified(input.userId);

				return ok(true);
			} catch (error: unknown) {
				tx.rollback();
				return err(new UnexpectedError(error));
			}
		});
	}
}
