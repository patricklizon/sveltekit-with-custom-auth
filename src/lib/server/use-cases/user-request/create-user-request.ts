import { err, ok, Result } from 'neverthrow';

import { UserDoesNotExistsError, type User, type UserPlainTextOTP } from '$lib/domain/user';
import type { UserRequest, UserRequestType } from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import { database, type TX } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	otp: UserPlainTextOTP;
	userId: User['id'];
	type: UserRequestType;
}>;

type UseCaseResult = Result<
	{ userRequestId: UserRequest['id'] },
	UserDoesNotExistsError | UnexpectedError
>;

/**
 * Use case for creating a new user request.
 *
 * It involves the following steps:
 *
 * - Verifying the user's existence,
 * - Saving the user request with the generated OTP
 */
export class CreateUserRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private userRequestRepository: UserRequestRepository,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const user = await this.userRepository.findById({ userId: input.userId }, txx);
				if (!user) {
					return err(new UserDoesNotExistsError(input.userId));
				}

				const userRequestId = await this.userRequestRepository.save(
					{ otp: input.otp, userId: user.id, type: input.type },
					txx
				);

				await this.userRequestRepository.deleteAllOfTypeButOneByUserId(
					{ type: input.type, userRequestId, userId: user.id },
					txx
				);

				return ok({ userRequestId });
			} catch (error) {
				// TODO: rollback transaction on error
				return err(new UnexpectedError(error));
			}
		});
	}
}
