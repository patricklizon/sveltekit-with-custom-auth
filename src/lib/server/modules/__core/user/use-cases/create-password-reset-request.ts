import type { UserRepository } from '../repository';
import {
	UserDoesNotExistsError,
	type User,
	type UserPasswordResetRequest
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import { TwoFactor } from '$lib/server/infrastructure/__core/security';

type UseCaseInput = Readonly<{
	email: User['email'];
}>;

type UseCaseResult = ResultAsync<
	UserPasswordResetRequest['id'],
	UserDoesNotExistsError | UnexpectedError
>;

export class CreatePasswordResetRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private twoFactor: TwoFactor
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const user = await this.userRepository.findByEmail(input.email);

			if (!user) {
				return err(new UserDoesNotExistsError(input.email));
			}

			await this.userRepository.deletePasswordResetRequestsForUser(user.id);

			const requestId = await this.userRepository.createPasswordResetRequest({
				otp: this.twoFactor.generateOTP(),
				expiresAt: new Date(Date.now() + 1000 * 60 * 10),
				userId: user.id
			});

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendCodeWithConfirmation.execute(user.email);

			return ok(requestId);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
