import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import {
	type UserRequest,
	UserRequestExpiredError,
	UserRequestNonExistingError,
	UserRequestNonConfirmedError
} from '$lib/shared/domain/__core/user-request';
import { IsUserRequestCorrectUseCase } from '$lib/server/modules/__core/user-request';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';

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
	constructor(private hasher: PasswordHasher) {}

	// TODO: handle unexpected errors
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const isUserRequestCorrectUseCase = new IsUserRequestCorrectUseCase(this.hasher);
			const validationResult = await isUserRequestCorrectUseCase.execute(input);
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
