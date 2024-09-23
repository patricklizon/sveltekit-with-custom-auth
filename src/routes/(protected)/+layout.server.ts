import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import {
	mapURLtoAbsoluteUrlPathWithSearchAndFragment,
	SetRedirectSearchParamUseCase
} from '$lib/shared/infrastructure/url-search-param';

const setRedirectSearchParam = new SetRedirectSearchParamUseCase();

// TODO: convert to factory and write test
export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		const baseURL = new URL('/login', event.url.href);
		const nextUrlResult = setRedirectSearchParam.execute({ baseURL }, event.request.url);
		// TODO: verify if it works
		const target = nextUrlResult
			.map(mapURLtoAbsoluteUrlPathWithSearchAndFragment)
			// TODO: add sentry logging
			.mapErr(console.error)
			.unwrapOr(baseURL);

		throw redirect(302, target);
	}

	if (!user.emailVerified) {
		throw redirect(302, '/confirm-email');
	}
};
