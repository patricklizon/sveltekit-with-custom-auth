import { err, ok, ResultAsync } from 'neverthrow';

import { UserRepository } from '../repository';

import { UnexpectedError } from '$lib/errors';
import { PasswordHasher, TwoFactor } from '$lib/server/infrastructure/__core/security';
import { database } from '$lib/server/infrastructure/persistance';
import { UserRequestRepository, UserRequestType } from '$lib/server/modules//__core/user-request';
import { UserDoesNotExistsError, type User } from '$lib/shared/domain/__core/user';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';

type UseCaseInput = Readonly<{
	email: User['email'];
}>;

type UseCaseResult = ResultAsync<UserRequest['id'], UserDoesNotExistsError | UnexpectedError>;

export class CreatePasswordResetRequestUseCase {
	constructor(
		private twoFactor: TwoFactor,
		private hasher: PasswordHasher,
		private db = database
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRepository = new UserRepository(this.hasher, tx);
				const userRequestRepository = new UserRequestRepository(this.hasher, tx);

				const user = await userRepository.findByEmail(input.email);

				if (!user) {
					return err(new UserDoesNotExistsError(input.email));
				}

				await userRequestRepository.deleteAllOfTypeByUserId(UserRequestType.ResetPassword, user.id);

				const requestId = await userRequestRepository.save({
					otp: this.twoFactor.generateOTP(),
					userId: user.id,
					type: UserRequestType.ResetPassword
				});

				// TODO: implement notification through 'communication channel -> email'
				// await this.sendCodeWithConfirmation.execute(user.email);

				return ok(requestId);
			} catch (error) {
				return err(new UnexpectedError(error));
			}
		});
	}
}
