import { error, redirect } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import { IsAllowedToStartPasswordResetProcessUseCase } from '$lib/server/modules/__core/user';

import { UnexpectedErrorType } from '$lib/errors';
import { safeCastId } from '$lib/shared/domain/__core/id';
import type { LayoutServerLoad } from './$types';
import { IsUserRequestCorrectUseCase } from '$lib/server/modules/__core/user-request';
import { UserRequestErrorType, type UserRequest } from '$lib/shared/domain/__core/user-request';
import { PasswordHasher } from '$lib/server/infrastructure/__core/security';

const hasher = new PasswordHasher();
const validateUserRequestUseCase = new IsUserRequestCorrectUseCase(hasher);
const isAllowedToStartPasswordResetProcess = new IsAllowedToStartPasswordResetProcessUseCase(
	validateUserRequestUseCase
);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const userRequestId: UserRequest['id'] = safeCastId(params.password_reset_request_id);
	const isAllowedToStartProcessResult = await isAllowedToStartPasswordResetProcess.execute({
		// TODO: fix
		userId: locals.user?.id,
		userRequestId
	});

	if (isAllowedToStartProcessResult.isErr()) {
		switch (isAllowedToStartProcessResult.error.type) {
			// TODO: create create separate views for handling errors. Maybe redirect to: RawPath.ResetPassword and display information there
			case UserRequestErrorType.Expired:
			case UserRequestErrorType.NonExisting: {
				throw redirect(302, resolveRoute(RawPath.ResetPassword, {}));
			}
			case UnexpectedErrorType: {
				throw error(500, isAllowedToStartProcessResult.error);
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		passwordResetRequestId: userRequestId
	};
};
