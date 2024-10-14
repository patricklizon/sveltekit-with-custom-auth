import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions } from './$types';

import { resolveRoute } from '$app/paths';
import { UserErrorType } from '$lib/domain/user';
import { UserRequestErrorType, UserRequestType } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { ConfirmEmailUseCase } from '$lib/server/use-cases/user';
import {
	ConfirmUserRequestUseCase,
	IsUserRequestCorrectUseCase
} from '$lib/server/use-cases/user-request';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { userRequestConfirmFormDataSchema } from '$lib/shared/validators/__core';
import type { FormParseFail } from '$lib/types';

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();
const hasher = new PasswordHashingService();
const isUserRequestCorrect = new IsUserRequestCorrectUseCase(hasher);
const confirmUserRequest = new ConfirmUserRequestUseCase(isUserRequestCorrect, hasher);

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session || !locals.user) {
			redirect(302, resolveRoute(RawPath.Login, {}));
		}

		const formData = Object.fromEntries(await request.formData());
		const parseResult = await userRequestConfirmFormDataSchema.safeParseAsync(formData);

		if (!parseResult.success) {
			return fail(400, {
				success: false,
				data: formData,
				errorType: UserErrorType.Validation,
				errorByFieldName: parseResult.error.flatten().fieldErrors
			} satisfies FormParseFail<typeof formData>);
		}

		const confirmResult = await confirmUserRequest.execute({
			otp: parseResult.data.otp,
			userRequestId: parseResult.data.requestId,
			userId: locals.user.id
		});

		// TODO: handle errors
		if (confirmResult.isErr()) {
			switch (confirmResult.error.type) {
				case UserRequestErrorType.Expired:
				case UserRequestErrorType.NonExisting:
				case UserRequestErrorType.InvalidVerificationCode:
				case UnexpectedErrorType: {
					console.log(confirmResult.error);
					return;
				}
			}
		}

		// TODO: handle
		switch (confirmResult.value.type) {
			case UserRequestType.ResetPassword:
			case UserRequestType.ChangeEmail: {
				console.log(confirmResult.value.type);
				return;
			}
			case UserRequestType.ConfirmUserEmail: {
				const confirmEmail = new ConfirmEmailUseCase(hasher);
				const result = await confirmEmail.execute({ userId: confirmResult.value.userId });
				if (result.isErr()) {
					switch (result.error.type) {
						case UserErrorType.NonExisting:
						case UnexpectedErrorType: {
							throw error(500, result.error);
						}
						// TODO: do not break the app, log error
						case UserErrorType.EmailAlreadyVerified: {
							break; // do nothing
						}
					}
				}
			}
		}

		const fallbackRoute = resolveRoute(RawPath.Home, {});
		const currentURL = new URL(request.url);
		const redirectRoute =
			readRedirectSearchParam.execute(currentURL).mapErr(console.error).unwrapOr(fallbackRoute) ??
			fallbackRoute;

		throw redirect(302, redirectRoute);
	}
};
