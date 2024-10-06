import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { RefreshSessionUseCase } from '$lib/server/modules/__core/user';

const cookieSessionManager = new CookieSessionManager();
const refreshSessionUseCase = new RefreshSessionUseCase(cookieSessionManager);

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
	const refreshResult = await refreshSessionUseCase.execute(event.cookies);

	event.locals.user = refreshResult?.user;
	event.locals.session = refreshResult?.session;

	return resolve(event);
};

export const handle: Handle = sequence(handleSessionRefresh);
