import { LogoutUseCase } from '$lib/server/modules/__core/user';
import {
	CookieSessionManager,
	isValidUserSession
} from '$lib/server/infrastructure/__core/security';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';

const cookieSessionManager = new CookieSessionManager();
const logoutUseCase = new LogoutUseCase(cookieSessionManager);

export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (!isValidUserSession(locals)) {
		throw redirect(302, resolveRoute(RawPath.Root, {}));
	}

	await logoutUseCase.execute(cookies);

	throw redirect(302, resolveRoute(RawPath.Login, {}));
};
