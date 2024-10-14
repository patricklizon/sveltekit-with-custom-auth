import { err, Result } from 'neverthrow';

import type { IsUserRequestCorrectUseCase } from '../user-request';

import type {
	UserRequest,
	UserRequestExpiredError,
	UserRequestNonExistingError
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	UserRequestExpiredError | UserRequestNonExistingError | UnexpectedError
>;

/**
 * Use case for validating if a password reset process can be started.
 *
 * This use case checks if a password reset request exists and is not expired.
 */
export class IsAllowedToStartPasswordResetProcessUseCase {
	constructor(private isUserRequestCorrectUseCase: IsUserRequestCorrectUseCase) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			return await this.isUserRequestCorrectUseCase.execute(input);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
