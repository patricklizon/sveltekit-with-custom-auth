import type { Actions } from '@sveltejs/kit';

export const actions: Actions = {
	deafult: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
	}
};
