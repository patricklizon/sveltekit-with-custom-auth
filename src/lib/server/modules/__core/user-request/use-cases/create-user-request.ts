import {
	UserDoesNotExistsError,
	type User,
	type UserPlainTextOTP
} from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';
import { UserRequestRepository, UserRequestType } from '$lib/server/modules/__core/user-request';
import { UserRepository } from '../../user';
import { database } from '$lib/server/infrastructure/persistance';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';

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
		private hasher: PasswordHasher,
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

				const user = await userRepository.findUserById(input.userId);
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
