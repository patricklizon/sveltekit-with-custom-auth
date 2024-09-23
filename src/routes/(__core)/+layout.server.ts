import type { LayoutServerLoad } from './$types';

/**
 * Server-side load function for the layout.
 *
 * @warning This code is critical for the template's functionality.
 * Modifying or removing this load function may break the template.
 * Proceed with caution and ensure thorough testing after any changes.
 */
export const load: LayoutServerLoad = async (event) => {
	return {
		session: event.locals.session,
		user: event.locals.user
	};
};
