import { err, ok, ResultAsync } from 'neverthrow';

import { UserDoesNotExistsError, type User } from '$lib/domain/user';
import { UserRequestType, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { OTPService } from '$lib/server/infrastructure/otp';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	email: User['email'];
}>;

type UseCaseResult = ResultAsync<UserRequest['id'], UserDoesNotExistsError | UnexpectedError>;

export class CreatePasswordResetRequestUseCase {
	constructor(
		private otp: OTPService,
		private hasher: PasswordHashingService,
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
					otp: this.otp.generateOTP(),
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
