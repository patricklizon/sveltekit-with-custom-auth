
import { error, fail, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { EmailService } from '$lib/server/infrastructure/__core/email';
import {
	PasswordHasher,
	CookieSessionManager,
	TwoFactor
} from '$lib/server/infrastructure/__core/security';
import {
	RegisterWithCredentialsUseCase,
	LoginWithCredentialsUseCase
} from '$lib/server/modules/__core/user';
import { CreateUserRequestConfirmEmailUseCase } from '$lib/server/modules/__core/user-request';
import { EmailErrorType } from '$lib/shared/domain/__core/email/errors';
import { UserErrorType } from '$lib/shared/domain/__core/user';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';
import { SetRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { userRegistrationWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/register';
import type { FormFail, FormParseFail } from '$lib/types';

const hasher = new PasswordHasher();
const cookieSessionManager = new CookieSessionManager();
const twoFactor = new TwoFactor();
const emailService = new EmailService();

const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	twoFactor,
	hasher,
	emailService
);
const registerWithCredentialsUseCase = new RegisterWithCredentialsUseCase(
	createUserRequestConfirmEmailUseCase,
	hasher
);
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(hasher, cookieSessionManager);

const setRedirectSearchParam = new SetRedirectSearchParamUseCase();

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
		const nextUrlResult = setRedirectSearchParam.execute({
			url: new URL(nextRoute, url),
			paramValue: redirectRoute
		});

		throw redirect(302, nextUrlResult);
	}
};
