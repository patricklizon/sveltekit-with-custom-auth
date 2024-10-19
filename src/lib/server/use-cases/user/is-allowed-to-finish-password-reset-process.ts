import { err, ok, ResultAsync } from 'neverthrow';

import { IsUserRequestCorrectUseCase } from '../user-request';

import {
	type UserRequest,
	UserRequestExpiredError,
	UserRequestNonExistingError,
	UserRequestNonConfirmedError
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = ResultAsync<
	UserRequest,
	| UserRequestNonExistingError
	| UserRequestExpiredError
	| UserRequestNonConfirmedError
	| UnexpectedError
>;

/**
 * Use case for validating if a password reset process can be finished.
 *
 * This use case checks if a password reset request exists, is not expired, and has been verified.
 */
export class IsAllowedToFinishPasswordResetProcessUseCase {
	constructor(private isUserRequestCorrectUseCase: IsUserRequestCorrectUseCase) {}

	// TODO: handle unexpected errors
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const validationResult = await this.isUserRequestCorrectUseCase.execute(input);
			if (validationResult.isErr()) {
				return err(validationResult.error);
			}

			const isConfirmed = !!validationResult.value.confirmedAt;
			if (!isConfirmed) {
				return err(new UserRequestNonConfirmedError(input.userRequestId));
			}

			return ok(validationResult.value);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
