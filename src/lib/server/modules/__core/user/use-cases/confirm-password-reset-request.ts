import { type UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type {
	UserRequestRepository,
	IsUserRequestCorrectUseCase
} from '$lib/server/modules/__core/user-request';
import {
	UserRequestInvalidCodeError,
	type UserRequest,
	type UserRequestExpiredError,
	type UserRequestNonConfirmedError,
	type UserRequestNonExistingError
} from '$lib/shared/domain/__core/user-request';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';

type UseCaseInput = Readonly<{
	otp: UserPlainTextOTP;
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	| UserRequestNonExistingError
	| UserRequestExpiredError
	| UserRequestNonConfirmedError
	| UserRequestInvalidCodeError
	| UnexpectedError
>;

export class ConfirmPasswordResetRequestUseCase {
	constructor(
		private userRequestRepository: UserRequestRepository,
		private isUserRequestCorrectUseCase: IsUserRequestCorrectUseCase,
		private hasher: PasswordHasher
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const validationResult = await this.isUserRequestCorrectUseCase.execute(input);
			if (validationResult.isErr()) {
				return err(validationResult.error);
			}

			const isCorrect = await this.hasher.verify(validationResult.value.hashedOTP, input.otp);
			if (isCorrect) {
				return err(new UserRequestInvalidCodeError(input.userRequestId));
			}

			const result = await this.userRequestRepository.confirm(input.userId, input.userRequestId);

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendEmailWithConfirmation.execute(user.email);

			return ok(result);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
