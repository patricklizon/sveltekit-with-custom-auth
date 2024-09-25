import {
	UserPasswordResetRequestExpiredError,
	UserPasswordResetRequestNonExistingError,
	UserPasswordResetRequestNonVerifiedError,
	type UserPasswordResetRequest
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type { UserRepository } from '../repository';

type UseCaseInput = Readonly<{
	id: UserPasswordResetRequest['id'];
}>;

type UseCaseResult = ResultAsync<
	UserPasswordResetRequest,
	| UserPasswordResetRequestNonExistingError
	| UserPasswordResetRequestExpiredError
	| UserPasswordResetRequestNonVerifiedError
	| UnexpectedError
>;

/**
 * Use case for validating if a password reset process can be finished.
 *
 * This use case checks if a password reset request exists, is not expired, and has been verified.
 */
export class CanFinishPasswordResetProcessUseCase {
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

			const isVerified = !!passwordResetRequest.verifiedAt;
			if (!isVerified) {
				return err(new UserPasswordResetRequestNonVerifiedError(input.id));
			}

			return ok(passwordResetRequest);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
