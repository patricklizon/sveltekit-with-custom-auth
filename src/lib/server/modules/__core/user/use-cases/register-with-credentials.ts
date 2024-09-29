import type { UserRepository } from '../repository';
import {
	UserAlreadyExistsError,
	UserInvalidDataError,
	type User,
	type UserPlainTextPassword
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { UnexpectedError } from '$lib/errors';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/register';

type UseCaseInput = Readonly<{
	email: User['email'];
	password: UserPlainTextPassword;
	passwordConfirmation: UserPlainTextPassword;
}>;

type UseCaseResult = ResultAsync<
	Readonly<User>,
	UserAlreadyExistsError | UserInvalidDataError | UnexpectedError
>;

export class RegisterWithCredentialsUseCase {
	constructor(private userRepository: UserRepository) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const searchResult = await this.userRepository.findByEmail(input.email);

			if (searchResult) {
				return err(new UserAlreadyExistsError(input.email));
			}

			const validationResult = userRegistrationWithCredentialsFormDataSchema.safeParse(input);
			if (!validationResult.success) {
				return err(new UserInvalidDataError(validationResult.error.message));
			}

			const result = await this.userRepository.save(
				{
					email: input.email,
					emailVerified: false,
					twoFactorEnabled: false,
					twoFactorVerified: false
				},
				input.password
			);

			return ok({
				email: result.email,
				emailVerified: result.emailVerified,
				id: result.id,
				twoFactorEnabled: result.twoFactorEnabled,
				twoFactorVerified: result.emailVerified
			});
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
