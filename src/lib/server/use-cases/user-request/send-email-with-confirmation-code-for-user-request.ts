import { err, ok, Result } from 'neverthrow';

import type { EmailRejectedError } from '$lib/domain/email';
import { UserDoesNotExistsError, type UserPlainTextOTP } from '$lib/domain/user';
import { UserRequestNonExistingError, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { EmailService } from '$lib/server/infrastructure/email';
import { database, safeTxRollback, type TX } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
	otp: UserPlainTextOTP;
}>;

type UseCaseResult = Result<
	true,
	UserRequestNonExistingError | UserDoesNotExistsError | EmailRejectedError | UnexpectedError
>;

/**
 * Use case for sending an email with a confirmation code for a user request.
 *
 * It involves the following steps:
 *
 * - Verifies the existence of the user request,
 * - Retrieves the user's email address,
 * - Sends an email containing the confirmation code (OTP) to the user
 */
export class SendEmailWithConfirmationCodeForUserRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private userRequestRepository: UserRequestRepository,
		private emailService: EmailService,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const userRequest = await this.userRequestRepository.findById({
					userId: input.userId,
					userRequestId: input.userRequestId
				});
				if (!userRequest) {
					safeTxRollback(txx);
					return err(new UserRequestNonExistingError(input.userRequestId));
				}

				const userEmail = await this.userRepository.getUserEmail(input);
				if (!userEmail) {
					safeTxRollback(txx);
					return err(new UserDoesNotExistsError(input.userId));
				}

				const sendResult = await this.emailService.send({
					to: userEmail.email,
					html: `<h1>confirmation code ${input.otp}</h1>`,
					subject: 'request confirmation code',
					text: `confirmation code ${input.otp}`
				});

				if (sendResult.isErr()) {
					safeTxRollback(txx);
					return err(sendResult.error);
				}

				return ok(sendResult.value);
			} catch (error) {
				safeTxRollback(txx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
