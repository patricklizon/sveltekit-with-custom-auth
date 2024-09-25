import type { UserRepository } from '../repository';
import {
	UserPasswordResetRequestExpiredError,
	UserPasswordResetRequestInvalidCodeError,
	UserPasswordResetRequestNonExistingError,
	type UserPasswordResetRequest
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';

type UseCaseInput = Readonly<{
	otp: UserPasswordResetRequest['otp'];
	id: UserPasswordResetRequest['id'];
}>;

type UseCaseResult = ResultAsync<
	boolean,
	UserPasswordResetRequestExpiredError | UserPasswordResetRequestInvalidCodeError | UnexpectedError
>;

export class ConfirmPasswordResetRequestUseCase {
	constructor(private userRepository: UserRepository) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const passwordResetRequest = await this.userRepository.findPasswordResetRequestById(input.id);
			if (!passwordResetRequest) {
				throw new UserPasswordResetRequestNonExistingError(input.id);
			}

			if (passwordResetRequest.expiresAt.getTime() <= Date.now()) {
				return err(new UserPasswordResetRequestExpiredError(passwordResetRequest.expiresAt));
			}

			if (passwordResetRequest.otp !== input.otp) {
				return err(new UserPasswordResetRequestInvalidCodeError(input.id, input.otp));
			}

			const result = await this.userRepository.confirmPasswordResetRequest(input.id);

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendEmailWithConfirmation.execute(user.email);

			return ok(!!result);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
