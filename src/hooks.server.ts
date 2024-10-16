import { type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { templateConfig } from '$lib/config';
import { AcceptLanguageHeaderParser } from '$lib/server/infrastructure/language';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { SessionService } from '$lib/server/infrastructure/session';
import { SessionRepository } from '$lib/server/infrastructure/session/repository';
import { UserRepository } from '$lib/server/infrastructure/user';
import {
	DetermineUserLanguagePreferenceUseCase,
	RefreshSessionUseCase
} from '$lib/server/use-cases/user';

const hasher = new PasswordHashingService();
const userRepository = new UserRepository(hasher, database);
const sessionRepository = new SessionRepository(database);
const sessionService = new SessionService(sessionRepository, userRepository);
const refreshSessionUseCase = new RefreshSessionUseCase(sessionService);
const acceptLanguageHeaderParser = new AcceptLanguageHeaderParser(
	templateConfig.supportedLanguages,
	templateConfig.mainLanguage
);
const determineUserLanguagePreferenceUseCase = new DetermineUserLanguagePreferenceUseCase(
	acceptLanguageHeaderParser
);

/**
 * Handles session refresh for the application.
 *
 * This function is crucial for maintaining user authentication state.
 * It attempt refreshing the session based on cookies.
 *
 * @warning Modifying this function may break the authentication flow of the template.
 * Ensure any changes are thoroughly tested
 */
const handleSessionRefresh: Handle = async ({ event, resolve }) => {
	const refreshResult = await refreshSessionUseCase.execute(event);

	event.locals.user = refreshResult?.user;
	event.locals.session = refreshResult?.session;

	return resolve(event);
};

/**
 * Handles the preferred language for the application.
 *
 * This function determines the language to be used for the current request.
 * It prioritizes user's preferred language if set,
 * and falls back to parsing the Accept-Language header.
 *
 * @warning Modifying this function may break i18n integration.
 * Ensure any changes are thoroughly tested
 */
const handlePreferredLanguage: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/')) {
		return resolve(event);
	}

	if (event.locals.user?.preferredLanguage) {
		event.locals.acceptLanguage = event.locals.user.preferredLanguage;
		return resolve(event);
	}

	const header = event.request.headers.get('Accept-Language') ?? '';
	const language = determineUserLanguagePreferenceUseCase.execute({ header });

	event.locals.acceptLanguage = language;

	return resolve(event);
};

export const handle: Handle = sequence(handleSessionRefresh, handlePreferredLanguage);
