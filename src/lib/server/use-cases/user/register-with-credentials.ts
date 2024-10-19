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
import { database, safeTxRollback, type TX } from '$lib/server/infrastructure/persistance';
import { UserRepository } from '$lib/server/infrastructure/user';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/infrastructure/validators/register';

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
		private userRepository: UserRepository,
		private db = database
	) {}

	async execute(input: UseCaseInput, tx?: TX): Promise<UseCaseResult> {
		return (tx ?? this.db).transaction(async (txx) => {
			try {
				const searchResult = await this.userRepository.findByEmail({ email: input.email }, txx);

				if (searchResult) {
					safeTxRollback(txx);
					return err(new UserAlreadyExistsError(input.email));
				}

				const validationResult = userRegistrationWithCredentialsFormDataSchema.safeParse(input);
				if (!validationResult.success) {
					safeTxRollback(txx);
					return err(new UserValidationError(validationResult.error.message));
				}

				const result = await this.userRepository.save(
					{
						email: input.email,
						password: input.password
					},
					txx
				);

				const confirmEmailResult = await this.createUserRequestConfirmEmailUseCase.execute({
					userId: result.id
				});

				if (confirmEmailResult.isErr()) {
					safeTxRollback(txx);
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
				safeTxRollback(txx);
				return err(new UnexpectedError(error));
			}
		});
	}
}
