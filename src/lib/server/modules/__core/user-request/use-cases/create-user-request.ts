import {
	UserDoesNotExistsError,
	type User,
	type UserPlainTextOTP
} from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';
import type {
	UserRequestRepository,
	UserRequestType
} from '$lib/server/modules/__core/user-request';
import type { UserRepository } from '../../user';

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
		private userRequestRepository: UserRequestRepository
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			// TODO: make it parot of transaction
			const user = await this.userRepository.findUserById(input.userId);
			if (!user) {
				return err(new UserDoesNotExistsError(input.userId));
			}

			// TODO: make it parot of transaction
			const userRequestId = await this.userRequestRepository.save({
				otp: input.otp,
				userId: user.id,
				type: input.type
			});

			// TODO: make it parot of transaction
			await this.userRequestRepository.deleteAllOfTypeButOneByUserId(
				input.type,
				userRequestId,
				user.id
			);

			return ok({ userRequestId });
		} catch (error) {
			// TODO: rollback transaction on error
			return err(new UnexpectedError(error));
		}
	}
}
