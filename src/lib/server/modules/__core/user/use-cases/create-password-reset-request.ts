import { UserDoesNotExistsError, type User } from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import { TwoFactor } from '$lib/server/infrastructure/__core/security';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';
import type { UserRequestRepository } from '$lib/server/modules//__core/user-request';
import type { UserRepository } from '../repository';

type UseCaseInput = Readonly<{
	email: User['email'];
}>;

type UseCaseResult = ResultAsync<UserRequest['id'], UserDoesNotExistsError | UnexpectedError>;

export class CreatePasswordResetRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private userRequestRepository: UserRequestRepository,
		private twoFactor: TwoFactor
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const user = await this.userRepository.findByEmail(input.email);

			if (!user) {
				return err(new UserDoesNotExistsError(input.email));
			}

			// TODO: extract 'password_reset' to enum
			await this.userRequestRepository.deleteAllOfTypeByUserId('password_reset', user.id);

			const requestId = await this.userRequestRepository.save({
				otp: this.twoFactor.generateOTP(),
				userId: user.id,
				type: 'password_reset'
			});

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendCodeWithConfirmation.execute(user.email);

			return ok(requestId);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
