import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import { CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { LogoutUseCase } from '$lib/server/modules/__core/user';

const cookieSessionManager = new CookieSessionManager();

const logoutUseCase = new LogoutUseCase(cookieSessionManager);

export const GET: RequestHandler = async ({ cookies }) => {
	await logoutUseCase.execute(cookies);

	throw redirect(302, resolveRoute(RawPath.Login, {}));
};
