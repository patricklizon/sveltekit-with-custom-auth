import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { EmailService } from '$lib/server/infrastructure/__core/email';
import {
	CookieSessionManager,
	isValidUserSession,
	PasswordHasher,
	TwoFactor
} from '$lib/server/infrastructure/__core/security';
import { LogoutUseCase } from '$lib/server/modules/__core/user';
import { CreateUserRequestConfirmEmailUseCase } from '$lib/server/modules/__core/user-request';
import { EmailErrorType } from '$lib/shared/domain/__core/email/errors';
import { UserErrorType, type User } from '$lib/shared/domain/__core/user';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';
import { SetRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';

// TODO: Manage DI
const twoFactor = new TwoFactor();
const emailService = new EmailService();
const hasher = new PasswordHasher();
const cookieSessionManager = new CookieSessionManager();
const logout = new LogoutUseCase(cookieSessionManager);
const setRedirectSearchParamUseCase = new SetRedirectSearchParamUseCase();

const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	twoFactor,

	hasher,
	emailService
);

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	const isInvalidSession = !isValidUserSession(locals);
	if (isInvalidSession) {
		await logout.execute(cookies);
		const loginRoute = setRedirectSearchParamUseCase.execute({
			url: new URL(resolveRoute(RawPath.Login, {}), url),
			paramValue: url.href
		});

		throw redirect(302, loginRoute);
	}

	const hasNotVerifiedEmail = !locals.user.emailVerified;
	if (hasNotVerifiedEmail) {
		const confirmUserRequestRoute = resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: ' '
		}).trim();
		if (url.href.includes(confirmUserRequestRoute)) return;

		await handleUserWithUnverifiedEmail(locals.user.id);
	}

	const isNotVerifiedWithTwoFactor = locals.user.twoFactorEnabled && !locals.user.twoFactorVerified;
	if (isNotVerifiedWithTwoFactor) {
		throw redirect(302, resolveRoute(RawPath.TwoFactorAuthentication, {}));
	}
};

async function handleUserWithUnverifiedEmail(userId: User['id']): Promise<never> {
	const confirmEmailResult = await createUserRequestConfirmEmailUseCase.execute({
		userId
	});

	// TODO: handle
	if (confirmEmailResult.isErr()) {
		switch (confirmEmailResult.error.type) {
			case EmailErrorType.Rejected:
			case UserErrorType.NonExisting:
			case UserRequestErrorType.NonExisting:
			case UnexpectedErrorType: {
				// TODO: throw errors and handle them in scoped custom +error page
				console.log(confirmEmailResult.error.type);
				return;
			}
		}
	}

	throw redirect(
		302,
		resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: confirmEmailResult.value.userRequestId
		})
	);
}
