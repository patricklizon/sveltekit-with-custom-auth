import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { SetRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import {
	CookieSessionManager,
	isValidUserSession,
	PasswordHasher,
	TwoFactor
} from '$lib/server/infrastructure/__core/security';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import { LogoutUseCase, UserRepository } from '$lib/server/modules/__core/user';
import {
	CreateUserRequestConfirmEmailUseCase,
	CreateUserRequestUseCase,
	SendEmailWithConfirmationCodeForUserRequestUseCase,
	UserRequestRepository
} from '$lib/server/modules/__core/user-request';
import { EmailService } from '$lib/server/infrastructure/__core/email';
import { EmailErrorType } from '$lib/shared/domain/__core/email/errors';
import { UserErrorType, type User } from '$lib/shared/domain/__core/user';
import { UnexpectedErrorType } from '$lib/errors';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';

// TODO: Manage DI
const twoFactor = new TwoFactor();
const emailService = new EmailService();
const hasher = new PasswordHasher();
const userRepository = new UserRepository(hasher);
const userRequestRepository = new UserRequestRepository(hasher);
const cookieSessionManager = new CookieSessionManager();
const logout = new LogoutUseCase(cookieSessionManager);
const createUserRequestUseCase = new CreateUserRequestUseCase(
	userRepository,
	userRequestRepository,
	twoFactor
);
const setRedirectSearchParamUseCase = new SetRedirectSearchParamUseCase();
const sendEmailUseCase = new SendEmailWithConfirmationCodeForUserRequestUseCase(
	emailService,
	userRequestRepository,
	userRepository
);
const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	twoFactor,
	sendEmailUseCase,
	createUserRequestUseCase
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
