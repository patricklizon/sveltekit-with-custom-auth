import { UserErrorType } from '$lib/shared/domain/__core/user';
import type { FormParseFail } from '$lib/types';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { userRequestConfirmFormDataSchema } from '$lib/shared/validators/__core';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import {
	ConfirmUserRequestUseCase,
	IsUserRequestCorrectUseCase,
	UserRequestRepository,
	UserRequestType
} from '$lib/server/modules/__core/user-request';
import { isValidUserSession, PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { UserRepository } from '$lib/server/modules/__core/user';

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();
const hasher = new PasswordHasher();
const userRepository = new UserRepository(hasher);
const userRequestRepositroy = new UserRequestRepository(hasher);
const isUserRequestCorrect = new IsUserRequestCorrectUseCase(userRequestRepositroy);
const confirmUserRequest = new ConfirmUserRequestUseCase(
	isUserRequestCorrect,
	userRequestRepositroy,
	hasher
);

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const isValidSession = isValidUserSession(locals);
		if (!isValidSession) {
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

		// TODO: handle
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
			case UserRequestType.ConfirmEmail: {
				await userRepository.setEmailAsVerified(confirmResult.value.userId);
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
