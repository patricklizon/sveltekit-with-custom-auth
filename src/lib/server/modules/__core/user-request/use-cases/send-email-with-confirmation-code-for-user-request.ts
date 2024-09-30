import type { EmailService } from '$lib/server/infrastructure/__core/email';
import { UserDoesNotExistsError, type UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import {
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import { err, ok, Result } from 'neverthrow';
import type { UserRequestRepository } from '../repository';
import type { UserRepository } from '../../user/repository';
import type { EmailRejectedError } from '$lib/shared/domain/__core/email/errors';
import type { UnexpectedError } from '$lib/errors';

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
		private emailService: EmailService,
		private userRequestRepository: UserRequestRepository,
		private userRepository: UserRepository
	) {}

	/**
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		const userRequest = await this.userRequestRepository.findById(
			input.userId,
			input.userRequestId
		);
		if (!userRequest) {
			return err(new UserRequestNonExistingError(input.userRequestId));
		}

		const userEmail = await this.userRepository.getUserEmail(input.userId);
		if (!userEmail) {
			return err(new UserDoesNotExistsError(input.userId));
		}

		const sendResult = await this.emailService.send({
			to: userEmail.email,
			html: `<h1>confirmation code ${input.otp}</h1>`,
			subject: 'request confirmation code',
			text: `confirmation code ${input.otp}`
		});

		if (sendResult.isErr()) {
			return err(sendResult.error);
		}

		return ok(sendResult.value);
	}
}
