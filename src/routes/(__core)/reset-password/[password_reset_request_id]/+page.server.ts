import { error, fail, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import { ConfirmPasswordResetRequestUseCase } from '$lib/server/modules/__core/user/use-cases/confirm-password-reset-request';
import { UserErrorType } from '$lib/shared/domain/__core/user';
import { UserRequestErrorType } from '$lib/shared/domain/__core/user-request';
import { resetPasswordConfirmRequestFormDataSchema } from '$lib/shared/validators/__core/reset-password';
import type { FormFail, FormParseFail } from '$lib/types';

const hasher = new PasswordHasher();
const confirmPasswordResetRequest = new ConfirmPasswordResetRequestUseCase(hasher);

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult =
			await resetPasswordConfirmRequestFormDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formDataParseResult,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		const { otp, passwordResetRequestId: userRequestId } = formDataParseResult.data;
		const confirmResult = await confirmPasswordResetRequest.execute({
			// TODO: fix
			userId: locals.user?.id,
			userRequestId,
			otp
		});

		if (confirmResult.isErr()) {
			switch (confirmResult.error.type) {
				case UserRequestErrorType.Expired: {
					return fail(400, {
						success: false,
						data: formDataParseResult,
						errorType: confirmResult.error.type,
						errorMessage: confirmResult.error.message
					} satisfies FormFail<typeof formDataParseResult>);
				}
				case UserRequestErrorType.InvalidVerificationCode: {
					return fail(400, {
						success: false,
						data: formDataParseResult,
						errorType: confirmResult.error.type,
						errorMessage: confirmResult.error.message
					} satisfies FormFail<typeof formDataParseResult>);
				}
				case UserRequestErrorType.NonExisting: {
					// TODO: improve error's handling ux
					throw redirect(302, resolveRoute(RawPath.ResetPassword, {}));
				}
				case UserRequestErrorType.NotConfirmed: {
					// TODO: improve error's handling ux
					throw redirect(302, resolveRoute(RawPath.ResetPasswordVerify, {}));
				}
				case UnexpectedErrorType: {
					throw error(500, confirmResult.error);
				}
			}
		}

		return { success: true };
	}
};
