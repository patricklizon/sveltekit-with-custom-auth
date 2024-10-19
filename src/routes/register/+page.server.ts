import { error, fail, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { EmailErrorType } from '$lib/domain/email';
import { UserErrorType } from '$lib/domain/user';
import { UserRequestErrorType } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { EmailService } from '$lib/server/infrastructure/email';
import { OTPService } from '$lib/server/infrastructure/otp';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService, SessionRepository } from '$lib/server/infrastructure/session';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';
import {
	LoginWithCredentialsUseCase,
	RegisterWithCredentialsUseCase
} from '$lib/server/use-cases/user';
import {
	CreateUserRequestConfirmEmailUseCase,
	CreateUserRequestUseCase,
	SendEmailWithConfirmationCodeForUserRequestUseCase
} from '$lib/server/use-cases/user-request';
import { setRedirectSearchParam } from '$lib/shared/infrastructure/url-search-param';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/infrastructure/validators/register';
import type { FormFail, FormParseFail } from '$lib/types';

const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const otpService = new OTPService();
const emailService = new EmailService();
const userRequestRepository = new UserRequestRepository(hasher);
const sendEmailWithConfirmationCodeForUserRequestUseCase =
	new SendEmailWithConfirmationCodeForUserRequestUseCase(
		userRepository,
		userRequestRepository,
		emailService
	);
const createUserRequestUseCase = new CreateUserRequestUseCase(
	userRepository,
	userRequestRepository
);
const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	otpService,
	createUserRequestUseCase,
	sendEmailWithConfirmationCodeForUserRequestUseCase
);
const registerWithCredentialsUseCase = new RegisterWithCredentialsUseCase(
	createUserRequestConfirmEmailUseCase,
	userRepository
);
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(
	hasher,
	sessionService,
	userRepository
);

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult =
			await userRegistrationWithCredentialsFormDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formData,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		const parsedData = formDataParseResult.data;
		const registrationResult = await registerWithCredentialsUseCase.execute(parsedData);

		// TODO: handle
		if (registrationResult.isErr()) {
			console.error(registrationResult.error);
			switch (registrationResult.error.type) {
				case UserErrorType.AlreadyExists:
				case UserErrorType.Validation: {
					return fail(400, {
						success: false,
						data: registrationResult.error.data,
						errorMessage: registrationResult.error.message,
						errorType: registrationResult.error.type
					} satisfies FormFail);
				}
				case UserRequestErrorType.NonExisting:
				case UserErrorType.NonExisting:
				case EmailErrorType.Rejected:
				case UnexpectedErrorType: {
					throw error(500, registrationResult.error);
				}
			}
		}

		const loginResult = await loginWithCredentialsUseCase.execute(
			{
				cookies,
				ip: getClientAddress(),
				userAgent: request.headers.get('user-agent') ?? 'Unknown'
			},
			{
				email: parsedData.email,
				password: parsedData.password
			}
		);

		// TODO: handle errors
		if (loginResult.isErr()) {
			switch (loginResult.error.type) {
				case UserErrorType.NonExisting:
				case UserErrorType.DataCorruption:
				case UserErrorType.InvalidPassword:
				case UnexpectedErrorType: {
					console.error(loginResult.error);
					return error(500, loginResult.error);
				}
			}
		}

		const nextRoute = resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: registrationResult.value.userRequestId
		});
		const redirectRoute = resolveRoute(RawPath.Home, {});
		const nextUrlResult = setRedirectSearchParam({
			url: new URL(nextRoute, url),
			paramValue: redirectRoute
		});

		throw redirect(302, nextUrlResult);
	}
};
