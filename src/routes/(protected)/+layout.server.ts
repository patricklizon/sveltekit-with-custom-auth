import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import {
	mapURLtoAbsoluteUrlPathWithSearchAndFragment,
	SetRedirectSearchParamUseCase
} from '$lib/shared/infrastructure/url-search-param';
import { isValidUserSession } from '$lib/server/infrastructure/__core/security';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';

const setRedirectSearchParam = new SetRedirectSearchParamUseCase();

// TODO: convert to factory and write test
export const load: LayoutServerLoad = async ({ locals, url, request }) => {
	if (!isValidUserSession(locals)) {
		const loginRoute = resolveRoute(RawPath.Login, {});
		const loginBaseURL = new URL(loginRoute, url.href);
		const nextUrlResult = setRedirectSearchParam.execute({ baseURL: loginBaseURL }, request.url);

		// TODO: verify if it works
		const targetRoute = nextUrlResult
			.map(mapURLtoAbsoluteUrlPathWithSearchAndFragment)
			// TODO: add sentry logging
			.mapErr(console.error)
			.unwrapOr(loginBaseURL);

		throw redirect(302, targetRoute);
	}

	if (!locals.user.emailVerified) {
		throw redirect(302, resolveRoute(RawPath.RegisterFinalize, {}));
	}

	// TODO: Verify link
	if (locals.user.twoFactorEnabled && !locals.user.twoFactorVerified) {
		throw redirect(302, resolveRoute(RawPath.TwoFactorAuthentication, {}));
	}
};
