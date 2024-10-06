import { type UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import { err, ok, Result } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import {
	UserRequestRepository,
	IsUserRequestCorrectUseCase
} from '$lib/server/modules/__core/user-request';
import {
	UserRequestInvalidCodeError,
	type UserRequest,
	type UserRequestExpiredError,
	type UserRequestNonConfirmedError,
	type UserRequestNonExistingError
} from '$lib/shared/domain/__core/user-request';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { database, safeTxRollback } from '$lib/server/infrastructure/persistance';

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
		private hasher: PasswordHasher,
		private db = database
	) {}
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRequestRepository = new UserRequestRepository(this.hasher, tx);
				const isUserRequestCorrectUseCase = new IsUserRequestCorrectUseCase(this.hasher, tx);
				const validationResult = await isUserRequestCorrectUseCase.execute(input);
				if (validationResult.isErr()) {
					safeTxRollback(tx);
					return err(validationResult.error);
				}

				const isCorrect = await this.hasher.verify(validationResult.value.hashedOTP, input.otp);
				if (isCorrect) {
					safeTxRollback(tx);
					return err(new UserRequestInvalidCodeError(input.userRequestId));
				}

				const result = await userRequestRepository.confirm(input.userId, input.userRequestId);

				// TODO: implement notification through 'communication channel -> email'
				// await this.sendEmailWithConfirmation.execute(user.email);

				return ok(result);
			} catch (error) {
				safeTxRollback(tx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
