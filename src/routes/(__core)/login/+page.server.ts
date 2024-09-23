import { UserErrorType, userLoginWithCredentialsDataSchema } from '$lib/shared/domain/__core/user';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { PasswordHasher, CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { LoginWithCredentialsUseCase, UserRepository } from '$lib/server/modules/__core/user';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';

const cookieSessionManager = new CookieSessionManager();
const userRepository = new UserRepository();
const hasher = new PasswordHasher();
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(
	userRepository,
	hasher,
	cookieSessionManager
);

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();

export const actions: Actions = {
	default: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parseResult = await userLoginWithCredentialsDataSchema.safeParseAsync(formData);

		if (!parseResult.success) {
			// TODO: define fail object
			return fail(400, {
				success: false,
				data: formData,
				errorType: UserErrorType.Validation,
				errorByFieldName: parseResult.error.flatten().fieldErrors
			});
		}

		const loginResult = await loginWithCredentialsUseCase.execute(
			{
				cookies: event.cookies,
				ip: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent') ?? 'Unknown'
			},
			{
				email: parseResult.data.email,
				password: parseResult.data.password
			}
		);

		if (loginResult.isErr()) {
			switch (loginResult.error.type) {
				case UserErrorType.NonExisting: {
					// TODO: define fail object
					return fail(401, {
						success: false,
						data: loginResult.error.data,
						error: loginResult.error.message,
						errorType: loginResult.error.type
					});
				}
				case UserErrorType.InvalidPassword: {
					// TODO: notify user on suspicious activity, should be done in the usecase
					// TODO: define fail object
					return fail(401, {
						success: false,
						data: loginResult.error.data,
						error: loginResult.error.message,
						errorType: loginResult.error.type
					});
				}

				case UserErrorType.DataCorruption:
				default: {
					// TODO: log error to logger (tbd. pnp wrapper for sentry, better stack)
					// TODO: better message
					throw error(500, { message: loginResult.error.message });
				}
			}
		}

		const fallbackAppUrl = '/home';
		const redirectUrl = readRedirectSearchParam
			.execute(new URL(event.request.url))
			.mapErr(console.error)
			.unwrapOr(fallbackAppUrl);

		throw redirect(302, redirectUrl ?? fallbackAppUrl);
	}
};
