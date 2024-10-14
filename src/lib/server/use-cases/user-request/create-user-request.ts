import { err, ok, Result } from 'neverthrow';

import { UserDoesNotExistsError, type User, type UserPlainTextOTP } from '$lib/domain/user';
import type { UserRequest, UserRequestType } from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
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
		private hasher: PasswordHashingService,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRepository = new UserRepository(this.hasher, tx);
				const userRequestRepository = new UserRequestRepository(this.hasher, tx);

				const user = await userRepository.findById(input.userId);
				if (!user) {
					return err(new UserDoesNotExistsError(input.userId));
				}

				const userRequestId = await userRequestRepository.save({
					otp: input.otp,
					userId: user.id,
					type: input.type
				});

				await userRequestRepository.deleteAllOfTypeButOneByUserId(
					input.type,
					userRequestId,
					user.id
				);

				return ok({ userRequestId });
			} catch (error) {
				// TODO: rollback transaction on error
				return err(new UnexpectedError(error));
			}
		});
	}
}
