import type { UserRepository } from '../repository';
import {
	UserAlreadyExistsError,
	UserInvalidDataError,
	type User,
	type UserPlainTextPassword
} from '$lib/shared/domain/__core/user';
import { err, ok, ResultAsync } from 'neverthrow';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { UnexpectedError } from '$lib/errors';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/register';
import type { EmailService } from '$lib/server/infrastructure/__core/email';

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
		private hasher: PasswordHasher,
		private emailService: EmailService
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

			const validationResult = userRegistrationWithCredentialsFormDataSchema.safeParse(input);
			if (!validationResult.success) {
				return err(new UserInvalidDataError(validationResult.error.message));
			}

			const hashedPassword = await this.hasher.hash(input.password);
			const result = await this.userRepository.save(
				{
					email: input.email,
					emailVerified: false,
					twoFactorEnabled: false,
					twoFactorVerified: false
				},
				hashedPassword
			);

			// TODO: create usecase
			await this.emailService.send({
				html: '<h1>you are registered</h1>',
				subject: 'registration confirmation',
				text: 'you are registered',
				to: 'lizon.patryk@gmail.com'
			});

			// TODO: implement notification through 'communication channel -> email'
			// await this.sendWelcomeEmail.execute(user.email);
			// await this.sendRegistrationConfirmation.execute(user.email);

			return ok({
				email: result.email,
				emailVerified: result.emailVerified,
				id: result.id,
				twoFactorEnabled: result.twoFactorEnabled,
				twoFactorVerified: result.emailVerified
			});
		} catch (error: unknown) {
			return err(new UnexpectedError(error));
		}
	}
}
