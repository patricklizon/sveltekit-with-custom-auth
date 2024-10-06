import type { EmailService } from '$lib/server/infrastructure/__core/email';
import { UserDoesNotExistsError, type UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import {
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import { err, ok, Result } from 'neverthrow';
import { UserRequestRepository } from '../repository';
import { UserRepository } from '../../user/repository';
import type { EmailRejectedError } from '$lib/shared/domain/__core/email/errors';
import { UnexpectedError } from '$lib/errors';
import { database, safeTxRollback } from '$lib/server/infrastructure/persistance';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';

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
		private hasher: PasswordHasher,
		private emailService: EmailService,
		private db = database
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRequestRepository = new UserRequestRepository(this.hasher, tx);
				const userRepository = new UserRepository(this.hasher, tx);

				const userRequest = await userRequestRepository.findById(input.userId, input.userRequestId);
				if (!userRequest) {
					safeTxRollback(tx);
					return err(new UserRequestNonExistingError(input.userRequestId));
				}

				const userEmail = await userRepository.getUserEmail(input.userId);
				if (!userEmail) {
					safeTxRollback(tx);
					return err(new UserDoesNotExistsError(input.userId));
				}

				const sendResult = await this.emailService.send({
					to: userEmail.email,
					html: `<h1>confirmation code ${input.otp}</h1>`,
					subject: 'request confirmation code',
					text: `confirmation code ${input.otp}`
				});

				if (sendResult.isErr()) {
					safeTxRollback(tx);
					return err(sendResult.error);
				}

				return ok(sendResult.value);
			} catch (error) {
				safeTxRollback(tx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
