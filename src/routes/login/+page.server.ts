import { error, fail, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { UserErrorType } from '$lib/domain/user';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService } from '$lib/server/infrastructure/session';
import { SessionRepository } from '$lib/server/infrastructure/session/repository';
import { UserRepository } from '$lib/server/infrastructure/user';
import { LoginWithCredentialsUseCase } from '$lib/server/use-cases/user';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { loginWithCredentialsFormDataSchema } from '$lib/shared/infrastructure/validators/login';
import type { FormFail, FormParseFail } from '$lib/types';

const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const loginWithCredentialsUseCase = new LoginWithCredentialsUseCase(hasher, sessionService);
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
