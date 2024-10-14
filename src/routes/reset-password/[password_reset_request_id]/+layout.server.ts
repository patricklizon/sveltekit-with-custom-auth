import { error, redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { safeCastId } from '$lib/domain/id';
import { UserRequestErrorType, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { IsAllowedToStartPasswordResetProcessUseCase } from '$lib/server/use-cases/user';
import { IsUserRequestCorrectUseCase } from '$lib/server/use-cases/user-request';

const hasher = new PasswordHashingService();
const validateUserRequestUseCase = new IsUserRequestCorrectUseCase(hasher);
const isAllowedToStartPasswordResetProcess = new IsAllowedToStartPasswordResetProcessUseCase(
	validateUserRequestUseCase
);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	// TODO: handle correctly
	if (!locals.user || !locals.session) return;

	const userRequestId: UserRequest['id'] = safeCastId(params.password_reset_request_id);
	const isAllowedToStartProcessResult = await isAllowedToStartPasswordResetProcess.execute({
		userId: locals.user.id,
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
