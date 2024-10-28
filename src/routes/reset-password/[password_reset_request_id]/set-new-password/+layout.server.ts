import { error, redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { resolveRoute } from '$app/paths';
import { safeCastId } from '$lib/domain/id';
import { UserRequestErrorType, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';
import { IsAllowedToFinishPasswordResetProcessUseCase } from '$lib/server/use-cases/user';
import { IsUserRequestCorrectUseCase } from '$lib/server/use-cases/user-request';

const hasher = new PasswordHashingService();
const userRequestRepository = new UserRequestRepository(hasher);
const isUserRequestCorrectUseCase = new IsUserRequestCorrectUseCase(userRequestRepository);
const isAllowedToFinishPasswordResetProcess = new IsAllowedToFinishPasswordResetProcessUseCase(
	isUserRequestCorrectUseCase
);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	// TODO: handle correctly
	if (!locals.user || !locals.session) return;

	const userRequestId: UserRequest['id'] = safeCastId(params.password_reset_request_id);
	const canFinishProcessResult = await isAllowedToFinishPasswordResetProcess.execute({
		userId: locals.user.id,
		userRequestId
	});

	if (canFinishProcessResult.isErr()) {
		switch (canFinishProcessResult.error.type) {
			// TODO: create create separate views for handling errors. Maybe redirect to: RawPath.ResetPassword and display information there

			case UserRequestErrorType.Expired:
			case UserRequestErrorType.NonExisting: {
				throw redirect(302, resolveRoute(RawPath.ResetPassword, {}));
			}
			case UserRequestErrorType.NotConfirmed: {
				throw redirect(
					302,
					resolveRoute(RawPath.ResetPasswordVerify, { password_reset_request_id: userRequestId })
				);
			}
			case UnexpectedErrorType: {
				throw error(500, 'Unexpected error happened');
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		passwordResetRequestId: userRequestId
	};
};
