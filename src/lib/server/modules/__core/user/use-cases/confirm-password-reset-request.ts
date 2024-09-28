import {} from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import type {
	UserRequestRepository,
	ValidateUserRequestUseCase
} from '$lib/server/modules/__core/user-request';
import {
	UserRequestInvalidCodeError,
	type UserRequest,
	type UserRequestExpiredError,
	type UserRequestNonConfirmedError,
	type UserRequestNonExistingError
} from '$lib/shared/domain/__core/user-request';

type UseCaseInput = Readonly<{
	otp: UserRequest['otp'];
	id: UserRequest['id'];
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
		private validateUserRequestUseCase: ValidateUserRequestUseCase
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const validationResult = await this.validateUserRequestUseCase.execute(input);
			if (validationResult.isErr()) {
				return err(validationResult.error);
			}

			if (validationResult.value.otp !== input.otp) {
				return err(new UserRequestInvalidCodeError(input.id, input.otp));
			}

			const result = await this.userRequestRepository.confirm(input.id);

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendEmailWithConfirmation.execute(user.email);

			return ok(result);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
