import { err, ok, Result } from 'neverthrow';

import { IsUserRequestCorrectUseCase } from '../user-request';

import { type UserPlainTextOTP } from '$lib/domain/user';
import {
	UserRequestInvalidCodeError,
	type UserRequest,
	type UserRequestExpiredError,
	type UserRequestNonConfirmedError,
	type UserRequestNonExistingError
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database, safeTxRollback, type TX } from '$lib/server/infrastructure/persistance';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	otp: UserPlainTextOTP;
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	| UserRequestNonExistingError
	| UserRequestExpiredError
	| UserRequestNonConfirmedError
	| UserRequestInvalidCodeError
	| UnexpectedError
>;

export class ConfirmPasswordResetRequestUseCase {
	constructor(
		private hasher: PasswordHashingService,
		private userRequestRepository: UserRequestRepository,
		private isUserRequestCorrectUseCase: IsUserRequestCorrectUseCase,
		private db = database
	) {}

	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const validationResult = await this.isUserRequestCorrectUseCase.execute(input);
				if (validationResult.isErr()) {
					safeTxRollback(txx);
					return err(validationResult.error);
				}

				const isCorrect = await this.hasher.verify(validationResult.value.hashedOTP, input.otp);
				if (isCorrect) {
					safeTxRollback(txx);
					return err(new UserRequestInvalidCodeError(input.userRequestId));
				}

				const result = await this.userRequestRepository.confirm({
					userId: input.userId,
					userRequestId: input.userRequestId
				});

				// TODO: implement notification through 'communication channel -> email'
				// await this.sendEmailWithConfirmation.execute(user.email);

				return ok(result);
			} catch (error) {
				safeTxRollback(txx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
