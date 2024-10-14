import { err, ok, ResultAsync } from 'neverthrow';

import type { CreateUserRequestConfirmEmailUseCase } from '../user-request';

import { EmailErrorType, EmailRejectedError } from '$lib/domain/email';
import {
	UserAlreadyExistsError,
	UserDoesNotExistsError,
	UserErrorType,
	UserValidationError,
	type User,
	type UserPlainTextPassword
} from '$lib/domain/user';
import {
	UserRequestErrorType,
	type UserRequest,
	type UserRequestNonExistingError
} from '$lib/domain/user-request';
import { UnexpectedError, UnexpectedErrorType } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database, safeTxRollback } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/register';

type UseCaseInput = Readonly<{
	email: User['email'];
	password: UserPlainTextPassword;
	passwordConfirmation: UserPlainTextPassword;
}>;

type UseCaseResult = ResultAsync<
	Readonly<{ userRequestId: UserRequest['id'] }>,
	| UserAlreadyExistsError
	| UserValidationError
	| UnexpectedError
	| EmailRejectedError
	| UserDoesNotExistsError
	| UserRequestNonExistingError
>;

export class RegisterWithCredentialsUseCase {
	constructor(
		// TODO: hide it as an implementation detail and inject requireddependencies.
		private createUserRequestConfirmEmailUseCase: CreateUserRequestConfirmEmailUseCase,
		private hasher: PasswordHashingService,
		private db = database
	) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		return this.db.transaction(async (tx) => {
			try {
				const userRepository = new UserRepository(this.hasher, tx);
				const searchResult = await userRepository.findByEmail(input.email);

				if (searchResult) {
					safeTxRollback(tx);
					return err(new UserAlreadyExistsError(input.email));
				}

				const validationResult = userRegistrationWithCredentialsFormDataSchema.safeParse(input);
				if (!validationResult.success) {
					safeTxRollback(tx);
					return err(new UserValidationError(validationResult.error.message));
				}

				const result = await userRepository.save(
					{
						email: input.email
					},
					input.password
				);

				const confirmEmailResult = await this.createUserRequestConfirmEmailUseCase.execute({
					userId: result.id
				});

				if (confirmEmailResult.isErr()) {
					safeTxRollback(tx);
					switch (confirmEmailResult.error.type) {
						case EmailErrorType.Rejected:
						case UserRequestErrorType.NonExisting:
						case UserErrorType.NonExisting:
						case UnexpectedErrorType: {
							return err(confirmEmailResult.error);
						}
					}
				}

				return ok({ userRequestId: confirmEmailResult.value.userRequestId });
			} catch (error) {
				safeTxRollback(tx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
