import { error, redirect } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { RawPath } from '$lib/routes';
import {
	CanStartPasswordResetProcessUseCase,
	UserRepository
} from '$lib/server/modules/__core/user';
import { UserErrorType, type UserPasswordResetRequest } from '$lib/shared/domain/__core/user';
import { UnexpectedErrorType } from '$lib/errors';
import { safeCastId } from '$lib/shared/domain/__core/id';
import type { LayoutServerLoad } from './$types';

const userRepository = new UserRepository();
const canStartPasswordResetProcess = new CanStartPasswordResetProcessUseCase(userRepository);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const id: UserPasswordResetRequest['id'] = safeCastId(params.password_reset_request_id);
	const canStartProcessResult = await canStartPasswordResetProcess.execute({ id });

	if (canStartProcessResult.isErr()) {
		switch (canStartProcessResult.error.type) {
			// TODO: create create separate views for handling errors. Maybe redirect to: RawPath.ResetPassword and display information there
			case UserErrorType.PasswordResetRequestExpired:
			case UserErrorType.PasswordResetRequestNonExisting: {
				throw redirect(302, resolveRoute(RawPath.ResetPassword, {}));
			}
			case UnexpectedErrorType: {
				throw error(500, canStartProcessResult.error);
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		passwordResetRequestId: id
	};
};
