import { UserErrorType } from '$lib/shared/domain/__core/user';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { PasswordHasher, CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { LoginWithCredentialsUseCase } from '$lib/server/modules/__core/user';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import type { FormFail, FormParseFail } from '$lib/types';
import { loginWithCredentialsFormDataSchema } from '$lib/shared/validators/__core/login';
import { UnexpectedErrorType } from '$lib/errors';

const cookieSessionManager = new CookieSessionManager();
const hasher = new PasswordHasher();
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(hasher, cookieSessionManager);

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();

export const actions: Actions = {
	default: async (event) => {
		const formData = Object.fromEntries(await event.request.formData());
		const parseResult = await loginWithCredentialsFormDataSchema.safeParseAsync(formData);

		if (!parseResult.success) {
			return fail(400, {
				success: false,
				data: formData,
				errorType: UserErrorType.Validation,
				errorByFieldName: parseResult.error.flatten().fieldErrors
			} satisfies FormParseFail<typeof formData>);
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
					return fail(401, {
						success: false,
						data: loginResult.error.data,
						errorMessage: loginResult.error.message,
						errorType: loginResult.error.type
					} satisfies FormFail<typeof loginResult.error.data>);
				}

				case UserErrorType.InvalidPassword: {
					// TODO: notify user on suspicious activity, should be done in the usecase
					return fail(401, {
						success: false,
						data: loginResult.error.data,
						errorMessage: loginResult.error.message,
						errorType: loginResult.error.type
					} satisfies FormFail<typeof loginResult.error.data>);
				}

				case UserErrorType.DataCorruption:
				case UnexpectedErrorType: {
					// TODO: log error to logger (tbd. pnp wrapper for sentry, better stack)
					// TODO: better message
					console.log(loginResult.error);
					throw error(500, loginResult.error);
				}
			}
		}

		const fallbackRoute = resolveRoute(RawPath.Home, {});
		const currentURL = new URL(event.url);
		const redirectRoute =
			readRedirectSearchParam.execute(currentURL).mapErr(console.error).unwrapOr(fallbackRoute) ??
			fallbackRoute;

		throw redirect(302, redirectRoute);
	}
};
