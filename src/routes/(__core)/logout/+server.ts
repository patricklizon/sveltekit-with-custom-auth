import { LogoutUseCase } from '$lib/server/modules/__core/user';
import { CookieSessionManager } from '$lib/server/infrastructure/__core/security';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const cookieSessionManager = new CookieSessionManager();
const logoutUseCase = new LogoutUseCase(cookieSessionManager);

export const GET: RequestHandler = async (event) => {
	if (!event.locals.session) {
		throw redirect(302, '/');
	}

	await logoutUseCase.execute(event.cookies);

	throw redirect(302, '/login');
};
