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
import type { EmailService } from '$lib/server/infrastructure/email';
import type { OTPService } from '$lib/server/infrastructure/otp';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';

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
		private twoFactor: OTPService,
		private hasher: PasswordHashingService,
		private emailService: EmailService,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const createUserRequestUseCase = new CreateUserRequestUseCase(this.hasher, tx);
				const otp = this.twoFactor.generateOTP();
				const createRequestResult = await createUserRequestUseCase.execute({
					otp,
					type: UserRequestType.ConfirmUserEmail,
					userId: input.userId
				});

				if (createRequestResult.isErr()) {
					return err(createRequestResult.error);
				}

				const sendEmailUseCase = new SendEmailWithConfirmationCodeForUserRequestUseCase(
					this.hasher,
					this.emailService,
					tx
				);
				const sendEmailResult = await sendEmailUseCase.execute({
					otp,
					userId: input.userId,
					userRequestId: createRequestResult.value.userRequestId
				});

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
