import { error, redirect } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import {
	CanFinishPasswordResetProcessUseCase,
	UserRepository
} from '$lib/server/modules/__core/user';
import { UserErrorType, type UserPasswordResetRequest } from '$lib/shared/domain/__core/user';
import { UnexpectedErrorType } from '$lib/errors';
import { safeCastId } from '$lib/shared/domain/__core/id';
import type { LayoutServerLoad } from './$types';

const userRepository = new UserRepository();
const canFinishPasswordResetProcess = new CanFinishPasswordResetProcessUseCase(userRepository);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const id: UserPasswordResetRequest['id'] = safeCastId(params.password_reset_request_id);
	const canFinishProcessResult = await canFinishPasswordResetProcess.execute({ id });

	if (canFinishProcessResult.isErr()) {
		switch (canFinishProcessResult.error.type) {
			// TODO: create create separate views for handling errors. Maybe redirect to: RawPath.ResetPassword and display information there
			case UserErrorType.PasswordResetRequestExpired:
			case UserErrorType.PasswordResetRequestNonExisting: {
				throw redirect(302, resolveRoute(RawPath.ResetPassword, {}));
			}
			case UserErrorType.PasswordResetRequestNonVerified: {
				throw redirect(
					302,
					resolveRoute(RawPath.ResetPasswordVerify, { password_reset_request_id: id })
				);
			}
			case UnexpectedErrorType: {
				throw error(500, canFinishProcessResult.error);
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		passwordResetRequestId: id
	};
};
