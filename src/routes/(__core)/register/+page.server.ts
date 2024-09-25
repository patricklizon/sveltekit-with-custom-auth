import {
	UserErrorType,
	userRegistrationWithCredentialsDataSchema
} from '$lib/shared/domain/__core/user';

import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import {
	UserRepository,
	RegisterWithCredentialsUseCase,
	LoginWithCredentialsUseCase
} from '$lib/server/modules/__core/user';
import { PasswordHasher, CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import type { FormFail, FormParseFail } from '$lib/types';

// TODO: add dependency injection
const userRepository = new UserRepository();
const hasher = new PasswordHasher();
const cookieSessionManager = new CookieSessionManager();
const registerWithCredentialsUseCase = new RegisterWithCredentialsUseCase(userRepository, hasher);
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(
	userRepository,
	hasher,
	cookieSessionManager
);

export const actions: Actions = {
	default: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const formDataParseResult =
			await userRegistrationWithCredentialsDataSchema.safeParseAsync(formData);

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
				// TODO: improve error handling
				case 'unexpected': {
					console.error(registrationResult.error);
					throw error(500, { message: 'An unexpected error occurred' });
				}
			}
		}

		const loginResult = await loginWithCredentialsUseCase.execute(
			{
				cookies: event.cookies,
				ip: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent') ?? 'Unknown'
			},
			{
				email: parsedData.email,
				password: parsedData.password
			}
		);

		// TODO: handle
		if (loginResult.isErr()) {
			console.error('Login failed after successful registration:', loginResult.error);
			// TODO: log error, logout and redirect to error page with `throw error()`
		}

		throw redirect(302, resolveRoute(RawPath.Home, {}));
	}
};
