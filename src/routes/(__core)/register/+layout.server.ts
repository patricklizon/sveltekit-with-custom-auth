import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(302, '/home');
	}

	return {
		user: event.locals.user,
		session: event.locals.session
	};
};
