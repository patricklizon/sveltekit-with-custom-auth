import type { LayoutServerLoad } from './$types';

import { isValidUserSession } from '$lib/server/infrastructure/__core/security';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!isValidUserSession(locals)) return;

	return {
		session: locals.session,
		user: locals.user
	};
};
