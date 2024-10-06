import { type UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import {
	UserRequestExpiredError,
	UserRequestInvalidCodeError,
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import {
	IsUserRequestCorrectUseCase,
	UserRequestRepository
} from '$lib/server/modules/__core/user-request';
import { database } from '$lib/server/infrastructure/persistance';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
	otp: UserPlainTextOTP;
}>;

type UseCaseResult = ResultAsync<
	UserRequest,
	| UserRequestNonExistingError
	| UserRequestExpiredError
	| UserRequestInvalidCodeError
	| UnexpectedError
>;

/**
 * Use case for confirming a user request.
 *
 * This class handles the confirmation process of a user request,
 * including verification of the one-time password (OTP) and updating
 * the request status.
 */
export class ConfirmUserRequestUseCase {
	constructor(
		private isUserRequestCorrectUseCase: IsUserRequestCorrectUseCase,

		private hasher: PasswordHasher,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const userRequestRepository = new UserRequestRepository(this.hasher, this.db);
			const isRequestCorrectResult = await this.isUserRequestCorrectUseCase.execute(input);
			if (isRequestCorrectResult.isErr()) {
				return err(isRequestCorrectResult.error);
			}

			const userRequest = isRequestCorrectResult.value;
			const isCorrectCode = await this.hasher.verify(userRequest.hashedOTP, input.otp);
			if (!isCorrectCode) {
				return err(new UserRequestInvalidCodeError(userRequest.id));
			}

			const confirmedUserRequest = await userRequestRepository.confirm(
				input.userId,
				userRequest.id
			);

			return ok(confirmedUserRequest);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
