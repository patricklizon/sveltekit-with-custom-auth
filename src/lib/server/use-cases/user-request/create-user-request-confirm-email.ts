import { err, ok, Result } from 'neverthrow';

import { CreateUserRequestUseCase } from './create-user-request';
import { SendEmailWithConfirmationCodeForUserRequestUseCase } from './send-email-with-confirmation-code-for-user-request';

import type { EmailRejectedError } from '$lib/domain/email';
import { UserDoesNotExistsError } from '$lib/domain/user';
import {
	UserRequestNonExistingError,
	UserRequestType,
	type UserRequest
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { OTPService } from '$lib/server/infrastructure/otp';
import { database, type TX } from '$lib/server/infrastructure/persistance';

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
		private otpService: OTPService,
		private createUserRequestUseCase: CreateUserRequestUseCase,
		private sendEmailUseCase: SendEmailWithConfirmationCodeForUserRequestUseCase,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const otp = this.otpService.generateOTP();
				const createRequestResult = await this.createUserRequestUseCase.execute(
					{
						otp,
						type: UserRequestType.ConfirmUserEmail,
						userId: input.userId
					},
					txx
				);

				if (createRequestResult.isErr()) {
					return err(createRequestResult.error);
				}

				const sendEmailResult = await this.sendEmailUseCase.execute(
					{
						otp,
						userId: input.userId,
						userRequestId: createRequestResult.value.userRequestId
					},
					txx
				);

				if (sendEmailResult.isErr()) {
					return err(sendEmailResult.error);
				}

				return ok(createRequestResult.value);
			} catch (error) {
				return err(new UnexpectedError(error));
			}
		});
	}
}
