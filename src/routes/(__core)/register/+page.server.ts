import { UserErrorType } from '$lib/shared/domain/__core/user';

import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import {
	UserRepository,
	RegisterWithCredentialsUseCase,
	LoginWithCredentialsUseCase
} from '$lib/server/modules/__core/user';
import {
	PasswordHasher,
	CookieSessionManager,
	TwoFactor
} from '$lib/server/infrastructure/__core/security';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import type { FormFail, FormParseFail } from '$lib/types';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/register';
import { UnexpectedErrorType } from '$lib/errors';
import {
	CreateUserRequestConfirmEmailUseCase,
	CreateUserRequestUseCase,
	SendEmailWithConfirmationCodeForUserRequestUseCase,
	UserRequestRepository
} from '$lib/server/modules/__core/user-request';
import { EmailService } from '$lib/server/infrastructure/__core/email';
import { EmailErrorType } from '$lib/shared/domain/__core/email/errors';
import { SetRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';

const hasher = new PasswordHasher();
const userRepository = new UserRepository(hasher);
const cookieSessionManager = new CookieSessionManager();
const userRequestRepository = new UserRequestRepository(hasher);
const twoFactor = new TwoFactor();
const emailService = new EmailService();
const createUserRequestUseCase = new CreateUserRequestUseCase(
	userRepository,
	userRequestRepository,
	twoFactor
);
const sendEmailUserRequestConfirmationUseCase =
	new SendEmailWithConfirmationCodeForUserRequestUseCase(
		emailService,
		userRequestRepository,
		userRepository
	);
const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	twoFactor,
	sendEmailUserRequestConfirmationUseCase,
	createUserRequestUseCase
);
const registerWithCredentialsUseCase = new RegisterWithCredentialsUseCase(userRepository);
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(
	userRepository,
	hasher,
	cookieSessionManager
);

const setRedirectSearchParam = new SetRedirectSearchParamUseCase();

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult =
			await userRegistrationWithCredentialsFormDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formDataParseResult,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		const parsedData = formDataParseResult.data;
		const registrationResult = await registerWithCredentialsUseCase.execute(parsedData);

		// TODO: handle
		if (registrationResult.isErr()) {
			switch (registrationResult.error.type) {
				case UserErrorType.AlreadyExists:
				case UserErrorType.InvalidData: {
					return fail(400, {
						success: false,
						data: registrationResult.error.data,
						errorMessage: registrationResult.error.message,
						errorType: registrationResult.error.type
					} satisfies FormFail);
				}
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

		// TODO: handle
		if (loginResult.isErr()) {
			switch (loginResult.error.type) {
				case UserErrorType.NonExisting:
				case UserErrorType.DataCorruption:
				case UserErrorType.InvalidPassword:
				case UnexpectedErrorType: {
					return error(500, loginResult.error);
				}
			}
		}

		const confirmEmailResult = await createUserRequestConfirmEmailUseCase.execute({
			userId: loginResult.value.id
		});

		if (confirmEmailResult.isErr()) {
			switch (confirmEmailResult.error.type) {
				case EmailErrorType.Rejected:
				case UserErrorType.NonExisting:
				case UserRequestErrorType.NonExisting:
				case UnexpectedErrorType: {
					return error(500, confirmEmailResult.error);
				}
			}
		}

		const nextRoute = resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: confirmEmailResult.value.userRequestId
		});
		const redirectRoute = resolveRoute(RawPath.Home, {});
		const nextUrlResult = setRedirectSearchParam.execute({
			url: new URL(nextRoute, url),
			paramValue: redirectRoute
		});

		throw redirect(302, nextUrlResult);
	}
};
