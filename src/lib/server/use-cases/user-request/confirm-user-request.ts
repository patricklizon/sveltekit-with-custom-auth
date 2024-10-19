import { err, ok, ResultAsync } from 'neverthrow';

import type { IsUserRequestCorrectUseCase } from './is-user-request-correct';

import { type UserPlainTextOTP } from '$lib/domain/user';
import {
	UserRequestExpiredError,
	UserRequestInvalidCodeError,
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

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

		private hasher: PasswordHashingService,
		private userRequestRepository: UserRequestRepository
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const isRequestCorrectResult = await this.isUserRequestCorrectUseCase.execute(input);
			if (isRequestCorrectResult.isErr()) {
				return err(isRequestCorrectResult.error);
			}

			const userRequest = isRequestCorrectResult.value;
			const isCorrectCode = await this.hasher.verify(userRequest.hashedOTP, input.otp);
			if (!isCorrectCode) {
				return err(new UserRequestInvalidCodeError(userRequest.id));
			}

			const confirmedUserRequest = await this.userRequestRepository.confirm({
				userId: input.userId,
				userRequestId: userRequest.id
			});

			return ok(confirmedUserRequest);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
