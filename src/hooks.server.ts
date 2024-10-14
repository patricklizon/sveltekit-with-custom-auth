import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService } from '$lib/server/infrastructure/session';
import { SessionRepository } from '$lib/server/infrastructure/session/repository';
import { UserRepository } from '$lib/server/infrastructure/user';
import { RefreshSessionUseCase } from '$lib/server/use-cases/user';

const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const refreshSessionUseCase = new RefreshSessionUseCase(sessionService);

/**
 * Handles session refresh for the application.
 * This function is crucial for maintaining user authentication state.
 * It uses the RefreshSessionUseCase to attempt refreshing the session based on cookies.
 * The result is then stored in event.locals for use in subsequent request handling.
 *
 * @warning Modifying this function may break the authentication flow of the template.
 * Ensure any changes are thoroughly tested and align with the overall auth strategy.
 */
const handleSessionRefresh: Handle = async ({ event, resolve }) => {
	const refreshResult = await refreshSessionUseCase.execute(event);

	event.locals.user = refreshResult?.user;
	event.locals.session = refreshResult?.session;

	return resolve(event);
};

export const handle: Handle = sequence(handleSessionRefresh);
