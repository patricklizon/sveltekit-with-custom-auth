import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { UnexpectedErrorType } from '$lib/errors';
import { isValidUserSession, PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { IsUserRequestCorrectUseCase } from '$lib/server/modules/__core/user-request';
import { safeCastId } from '$lib/shared/domain/__core/id';
import { UserRequestErrorType, type UserRequest } from '$lib/shared/domain/__core/user-request';


const hasher = new PasswordHasher();
const isUserRequestCorrectUseCase = new IsUserRequestCorrectUseCase(hasher);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!isValidUserSession(locals)) {
		return undefined;
	}

	const userRequestId: UserRequest['id'] = safeCastId(params.user_request_id);
	const userId = locals.user.id;

	const isRequestCorrectResult = await isUserRequestCorrectUseCase.execute({
		userId,
		userRequestId
	});

	if (isRequestCorrectResult.isErr()) {
		switch (isRequestCorrectResult.error.type) {
			case UserRequestErrorType.Expired: {
				throw error(410, {
					message: 'Request expired'
				});
			}
			case UserRequestErrorType.NonExisting: {
				throw error(404, {
					message: 'Request does not exists'
				});
			}
			case UnexpectedErrorType: {
				throw error(500, isRequestCorrectResult.error);
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		userRequestId
	};
};
