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
	CreateUserRequestUseCase,
	SendEmailUserRequestConfirmationCodeUseCase,
	UserRequestRepository,
	UserRequestType
} from '$lib/server/modules/__core/user-request';
import { EmailService } from '$lib/server/infrastructure/__core/email';
import { EmailErrorType } from '$lib/shared/domain/__core/email/errors';
import { UserErrorType, type User } from '$lib/shared/domain/__core/user';
import { UnexpectedErrorType } from '$lib/errors';

// TODO: Manage DI
const hasher = new PasswordHasher();
const userRepository = new UserRepository(hasher);
const userRequestRepository = new UserRequestRepository(hasher);
const cookieSessionManager = new CookieSessionManager();
const logout = new LogoutUseCase(cookieSessionManager);
const twoFactor = new TwoFactor();
const emailService = new EmailService();
const sendEmailUserRequestConfirmationCodeUseCase = new SendEmailUserRequestConfirmationCodeUseCase(
	emailService,
	userRequestRepository,
	userRepository
);
const createUserRequestUseCase = new CreateUserRequestUseCase(
	userRepository,
	userRequestRepository,
	twoFactor,
	sendEmailUserRequestConfirmationCodeUseCase
);
const setRedirectSearchParamUseCase = new SetRedirectSearchParamUseCase();

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
	const userRequest = await createUserRequestUseCase.execute({
		userId,
		type: UserRequestType.ConfirmEmail
	});

	// TODO: handle
	if (userRequest.isErr()) {
		switch (userRequest.error.type) {
			case EmailErrorType.Rejected:
			case UserErrorType.NonExisting:
			case UnexpectedErrorType: {
				// TODO: throw errors and handle them in scoped custom +error page
				console.log(userRequest.error.type);
				return;
			}
		}
	}

	throw redirect(
		302,
		resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: userRequest.value
		})
	);
}
