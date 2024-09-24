import type { UserRepository } from '../repository';
import {
	UserAlreadyExistsError,
	UserInvalidDataError,
	userRegistrationWithCredentialsDataSchema,
	type User,
	type UserPlainTextPassword
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import { createId } from '$lib/shared/domain/__core/id';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { UnexpectedError } from '$lib/errors';

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
	constructor(
		private userRepository: UserRepository,
		private hasher: PasswordHasher
		// private sendWelcomeEmail: SendWelcomeEmailUsecase,
		// private sendRegistrationConfirmation: SendRegistrationConfirmationEmailUsecase,
	) {}

	// TODO: handle unexpected errors
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const searchResult = await this.userRepository.findByEmail(input.email);

			if (searchResult) {
				return err(new UserAlreadyExistsError(input.email));
			}

			const validationResult = userRegistrationWithCredentialsDataSchema.safeParse(input);
			if (!validationResult.success) {
				return err(new UserInvalidDataError(validationResult.error.message));
			}

			const user = {
				email: input.email,
				emailVerified: false,
				id: createId(),
				registered2FA: false,
				twoFactorVerified: false
			} satisfies User;

			const hashedPassword = await this.hasher.hash(input.password);
			await this.userRepository.save(user, hashedPassword);

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendWelcomeEmail.execute(user.email);
			// await this.sendRegistrationConfirmation.execute(user.email);

			return ok(user);
		} catch (error: unknown) {
			return err(new UnexpectedError(error));
		}
	}
}
