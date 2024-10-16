import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService, SessionRepository } from '$lib/server/infrastructure/session';
import { UserRepository } from '$lib/server/infrastructure/user';
import { LogoutUseCase } from '$lib/server/use-cases/user';

const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const logoutUseCase = new LogoutUseCase(sessionService);

export const GET: RequestHandler = async ({ cookies }) => {
	await logoutUseCase.execute(cookies);

	throw redirect(302, resolveRoute(RawPath.Login, {}));
};
