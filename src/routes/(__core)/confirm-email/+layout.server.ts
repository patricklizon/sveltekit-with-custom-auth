import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/login');
	}

	if (event.locals.user.emailVerified) {
		throw redirect(302, '/home');
	}
};
