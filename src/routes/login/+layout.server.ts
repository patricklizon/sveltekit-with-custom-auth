import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import { ReadRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';

const readRedirectSearchParam = new ReadRedirectSearchParamUseCase();

export const load: LayoutServerLoad = async ({ url, locals }) => {
	if (!locals.session || !locals.user) return;

	const fallbackRoute = resolveRoute(RawPath.Home, {});
	const currentURL = new URL(url.href);
	// TODO: verify and add sentry
	const redirectRoute =
		readRedirectSearchParam.execute(currentURL).mapErr(console.error).unwrapOr(fallbackRoute) ??
		fallbackRoute;

	throw redirect(302, redirectRoute);
};
