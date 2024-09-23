import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();

export const load: LayoutServerLoad = async (event) => {
	if (!event.locals.user) {
		return;
	}

	const fallbackAppUrl = '/home';

	// TODO: verify and add sentry
	const redirectUrl = readRedirectSearchParam
		.execute(new URL(event.request.url))
		.mapErr(console.error)
		.unwrapOr(fallbackAppUrl);

	throw redirect(302, redirectUrl ?? fallbackAppUrl);
};
