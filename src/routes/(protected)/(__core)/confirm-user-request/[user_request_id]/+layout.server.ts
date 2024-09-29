import { safeCastId } from '$lib/shared/domain/__core/id';
import type { UserRequest } from '$lib/shared/domain/__core/user-request';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const userRequestId: UserRequest['id'] = safeCastId(params.user_request_id);

	return {
		session: locals.session,
		user: locals.user,
		userRequestId
	};
};
