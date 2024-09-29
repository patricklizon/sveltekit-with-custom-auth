import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { SetRedirectSearchParamUseCase } from '$lib/shared/infrastructure/url-search-param';
import { isValidUserSession } from '$lib/server/infrastructure/__core/security';
import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';

const setRedirectSearchParam = new SetRedirectSearchParamUseCase();

// TODO: convert to factory and write test
export const load: LayoutServerLoad = async ({ locals, url, request }) => {
	if (!isValidUserSession(locals)) {
		const nextRoute = resolveRoute(RawPath.Login, {});
		const nextUrlResult = setRedirectSearchParam.execute({
			url: new URL(nextRoute, url.href),
			paramValue: request.url
		});

		throw redirect(302, nextUrlResult);
	}

	if (!locals.user.emailVerified) {
		const confirmUserRequestRoute = resolveRoute(RawPath.ConfirmUserRequest, {
			user_request_id: ' '
		}).trim();
		if (!request.url.includes(confirmUserRequestRoute)) {
			throw redirect(302, resolveRoute(RawPath.Login, {}));
		}
	}

	// TODO: Verify link
	if (locals.user.twoFactorEnabled && !locals.user.twoFactorVerified) {
		throw redirect(302, resolveRoute(RawPath.TwoFactorAuthentication, {}));
	}
};
