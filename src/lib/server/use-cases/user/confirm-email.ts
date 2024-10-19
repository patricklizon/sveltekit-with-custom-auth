import { err, ok, Result } from 'neverthrow';

import { UserDoesNotExistsError, UserEmailAlreadyVerifiedError, type User } from '$lib/domain/user';
import { UnexpectedError } from '$lib/errors';
import { database, safeTxRollback, type TX } from '$lib/server/infrastructure/persistance';
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
		private userRepository: UserRepository,
		private db = database
	) {}
	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const user = await this.userRepository.findById({ userId: input.userId });

				if (!user) {
					safeTxRollback(txx);
					return err(new UserEmailAlreadyVerifiedError(input.userId));
				}

				if (user.isEmailVerified) {
					safeTxRollback(txx);
					return err(new UnexpectedError('Email already verified'));
				}

				await this.userRepository.setEmailAsVerified({ userId: input.userId });

				return ok(true);
			} catch (error: unknown) {
				txx.rollback();
				return err(new UnexpectedError(error));
			}
		});
	}
}
