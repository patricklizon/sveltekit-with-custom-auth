import { UserDoesNotExistsError, type User } from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import { TwoFactor } from '$lib/server/infrastructure/__core/security';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';
import type {
	SendEmailUserRequestConfirmationCodeUseCase,
	UserRequestRepository,
	UserRequestType
} from '$lib/server/modules/__core/user-request';
import type { UserRepository } from '../../user';
import type { EmailRejectedError } from '$lib/shared/domain/__core/email/errors';

type UseCaseInput = Readonly<{
	userId: User['id'];
	type: UserRequestType;
}>;

type UseCaseResult = ResultAsync<
	UserRequest['id'],
	UserDoesNotExistsError | EmailRejectedError | UnexpectedError
>;

export class CreateUserRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private userRequestRepository: UserRequestRepository,
		private twoFactor: TwoFactor,
		private sendEmail: SendEmailUserRequestConfirmationCodeUseCase
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const user = await this.userRepository.findUserById(input.userId);

			if (!user) {
				return err(new UserDoesNotExistsError(input.userId));
			}

			const otp = this.twoFactor.generateOTP();

			const requestId = await this.userRequestRepository.save({
				otp,
				userId: user.id,
				type: input.type
			});

			const sendEmailResult = await this.sendEmail.execute({
				otp,
				requestId,
				userId: input.userId
			});
			if (sendEmailResult.isErr()) {
				return err(sendEmailResult.error);
			}

			return ok(requestId);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
