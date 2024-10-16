import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { EmailErrorType } from '$lib/domain/email';
import { UserErrorType, type User } from '$lib/domain/user';
import { UserRequestErrorType } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { EmailService } from '$lib/server/infrastructure/email';
import { OTPService } from '$lib/server/infrastructure/otp';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService } from '$lib/server/infrastructure/session';
import { SessionRepository } from '$lib/server/infrastructure/session/repository';
import { UserRepository } from '$lib/server/infrastructure/user';
import { LogoutUseCase } from '$lib/server/use-cases/user';
import { CreateUserRequestConfirmEmailUseCase } from '$lib/server/use-cases/user-request';
import { setRedirectSearchParam } from '$lib/shared/infrastructure/url-search-param';

// TODO: Manage DI
const twoFactor = new OTPService();
const emailService = new EmailService();
const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const logout = new LogoutUseCase(sessionService);

const createUserRequestConfirmEmailUseCase = new CreateUserRequestConfirmEmailUseCase(
	twoFactor,

	hasher,
	emailService
);

export const load: LayoutServerLoad = async ({ locals, cookies, url }) => {
	if (!locals.session || !locals.user) {
		await logout.execute(cookies);
		const loginRoute = setRedirectSearchParam({
			url: new URL(resolveRoute(RawPath.Login, {}), url),
			paramValue: url.href
		});

		throw redirect(302, loginRoute);
	}

	const hasNotVerifiedEmail = !locals.user.isEmailVerified;
	if (hasNotVerifiedEmail) {
		const confirmUserRequestRoute = resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: ' '
		}).trim();
		if (url.href.includes(confirmUserRequestRoute)) return;

		await handleUserWithUnverifiedEmail(locals.user.id);
	}

	if (locals.user.is2FAEnabled) {
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
