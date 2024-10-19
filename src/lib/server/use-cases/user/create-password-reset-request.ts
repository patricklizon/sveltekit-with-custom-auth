import { err, ok, ResultAsync } from 'neverthrow';

import { UserDoesNotExistsError, type User } from '$lib/domain/user';
import { UserRequestType, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { OTPService } from '$lib/server/infrastructure/otp';
import { database, type TX } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	email: User['email'];
}>;

type UseCaseResult = ResultAsync<UserRequest['id'], UserDoesNotExistsError | UnexpectedError>;

export class CreatePasswordResetRequestUseCase {
	constructor(
		private userRepository: UserRepository,
		private userRequestRepository: UserRequestRepository,
		private otpService: OTPService,
		private db = database
	) {}
	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const user = await this.userRepository.findByEmail({ email: input.email }, txx);

				if (!user) {
					return err(new UserDoesNotExistsError(input.email));
				}

				await this.userRequestRepository.deleteAllOfTypeByUserId(
					{ type: UserRequestType.ResetPassword, userId: user.id },
					txx
				);

				const requestId = await this.userRequestRepository.save(
					{
						otp: this.otpService.generateOTP(),
						userId: user.id,
						type: UserRequestType.ResetPassword
					},
					txx
				);

				// TODO: implement notification through 'communication channel -> email'
				// await this.sendCodeWithConfirmation.execute(user.email);

				return ok(requestId);
			} catch (error) {
				return err(new UnexpectedError(error));
			}
		});
	}
}
