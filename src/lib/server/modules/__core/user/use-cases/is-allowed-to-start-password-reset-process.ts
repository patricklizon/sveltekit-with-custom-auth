import { err, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type {
	UserRequest,
	UserRequestExpiredError,
	UserRequestNonExistingError
} from '$lib/shared/domain/__core/user-request';
import type { ValidateUserRequestUseCase } from '$lib/server/modules/__core/user-request';

type UseCaseInput = Readonly<{
	id: UserRequest['id'];
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
	constructor(private validateUserRequestUseCase: ValidateUserRequestUseCase) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			return await this.validateUserRequestUseCase.execute(input);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
