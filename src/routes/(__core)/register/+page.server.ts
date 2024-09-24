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
		const parseResult = await userRegistrationWithCredentialsDataSchema.safeParseAsync(formData);

		if (!parseResult.success) {
			return fail(400, {
				success: false,
				data: formData,
				errors: parseResult.error.flatten().fieldErrors
			});
		}

		const parsedData = parseResult.data;
		const registrationResult = await registerWithCredentialsUseCase.execute(parsedData);

		if (registrationResult.isErr()) {
			switch (registrationResult.error.type) {
				case UserErrorType.AlreadyExists:
				case UserErrorType.InvalidData: {
					return fail(400, {
						success: false,
						...registrationResult.error
					});
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

		if (loginResult.isErr()) {
			console.error('Login failed after successful registration:', loginResult.error);
			// TODO: log error, logout and redirect to error page with `throw error()`
		}

		throw redirect(302, resolveRoute(RawPath.Home, {}));
	}
};
