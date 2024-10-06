import {
	UserDoesNotExistsError,
	UserEmailAlreadyVerifiedError,
	type User
} from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';

import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { database, safeTxRollback } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '../repository';

type UseCaseInput = Readonly<{
	userId: User['id'];
}>;

type UseCaseResult = Result<
	true,
	UserDoesNotExistsError | UserEmailAlreadyVerifiedError | UnexpectedError
>;

export class ConfirmEmailUseCase {
	constructor(
		private hasher: PasswordHasher,
		private db = database
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRepository = new UserRepository(this.hasher, tx);
				const user = await userRepository.findUserById(input.userId);

				if (!user) {
					safeTxRollback(tx);
					return err(new UserEmailAlreadyVerifiedError(input.userId));
				}

				if (user.emailVerified) {
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
