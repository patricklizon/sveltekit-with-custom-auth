import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';

export const load: LayoutServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(302, resolveRoute(RawPath.Home, {}));
	}

	return {
		user: event.locals.user,
		session: event.locals.session
	};
};
