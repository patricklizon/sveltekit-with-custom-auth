import { UserDoesNotExistsError } from '$lib/shared/domain/__core/user';
import {
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import { err, ok, Result } from 'neverthrow';
import { type EmailRejectedError } from '$lib/shared/domain/__core/email/errors';
import { type UnexpectedError } from '$lib/errors';
import type { CreateUserRequestUseCase } from './create-user-request';
import type { TwoFactor } from '$lib/server/infrastructure/__core/security';
import { UserRequestType } from '../config';
import type { SendEmailWithConfirmationCodeForUserRequestUseCase } from './send-email-with-confirmation-code-for-user-request';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
}>;

type UseCaseResult = Result<
	{ userRequestId: UserRequest['id'] },
	UserRequestNonExistingError | UserDoesNotExistsError | EmailRejectedError | UnexpectedError
>;

/**
 * This use case is responsible for creating a user request to confirm an email address.
 *
 * It involves the following steps:
 *
 * - Generates a one-time password (OTP),
 * - Creates a user request of type ConfirmEmail,
 * - Sends an email with the OTP to the user
 */
export class CreateUserRequestConfirmEmailUseCase {
	constructor(
		private twoFactor: TwoFactor,
		private sendEmailUseCase: SendEmailWithConfirmationCodeForUserRequestUseCase,
		private createUserRequestUseCase: CreateUserRequestUseCase
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		const otp = this.twoFactor.generateOTP();
		const createRequestResult = await this.createUserRequestUseCase.execute({
			otp,
			type: UserRequestType.ConfirmEmail,
			userId: input.userId
		});

		if (createRequestResult.isErr()) {
			return err(createRequestResult.error);
		}

		const sendEmailResult = await this.sendEmailUseCase.execute({
			otp,
			userId: input.userId,
			userRequestId: createRequestResult.value.userRequestId
		});

		if (sendEmailResult.isErr()) {
			return err(sendEmailResult.error);
		}

		return ok(createRequestResult.value);
	}
}
