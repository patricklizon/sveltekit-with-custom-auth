import type { UserRepository } from '../repository';
import {
	UserPasswordResetRequestNonExistingError,
	type UserPasswordResetRequest,
	UserPasswordResetRequestExpiredError
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';

type UseCaseInput = Readonly<{
	id: UserPasswordResetRequest['id'];
}>;

type UseCaseResult = ResultAsync<
	UserPasswordResetRequest,
	UserPasswordResetRequestNonExistingError | UserPasswordResetRequestExpiredError | UnexpectedError
>;

/**
 * Use case for validating if a password reset process can be started.
 *
 * This use case checks if a password reset request exists and is not expired.
 */
export class CanStartPasswordResetProcessUseCase {
	constructor(private userRepository: UserRepository) {}

	// TODO: handle unexpected errors
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const passwordResetRequest = await this.userRepository.findPasswordResetRequestById(input.id);
			if (!passwordResetRequest) {
				return err(new UserPasswordResetRequestNonExistingError(input.id));
			}

			const isExpired = passwordResetRequest.expiresAt.getTime() <= Date.now();
			if (isExpired) {
				return err(new UserPasswordResetRequestExpiredError(passwordResetRequest.expiresAt));
			}

			return ok(passwordResetRequest);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
