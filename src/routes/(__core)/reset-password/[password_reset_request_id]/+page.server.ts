import { UnexpectedErrorType } from '$lib/errors';
import { UserRepository } from '$lib/server/modules/__core/user';
import { ConfirmPasswordResetRequestUseCase } from '$lib/server/modules/__core/user/use-cases/confirm-password-reset-request';
import { userConfirmPasswordResetDataSchema, UserErrorType } from '$lib/shared/domain/__core/user';
import type { FormFail, FormParseFail } from '$lib/types';
import { error, fail, type Actions } from '@sveltejs/kit';

const userRepository = new UserRepository();
const confirmPasswordResetRequest = new ConfirmPasswordResetRequestUseCase(userRepository);

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult = await userConfirmPasswordResetDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formDataParseResult,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		const { otp, passwordResetRequestId: id } = formDataParseResult.data;
		const confirmResult = await confirmPasswordResetRequest.execute({
			otp,
			id
		});

		if (confirmResult.isErr()) {
			switch (confirmResult.error.type) {
				case UserErrorType.PasswordResetRequestExpired: {
					return fail(400, {
						success: false,
						data: formDataParseResult,
						errorType: confirmResult.error.type,
						errorMessage: confirmResult.error.message
					} satisfies FormFail<typeof formDataParseResult>);
				}

				case UserErrorType.PasswordResetRequestInvalidCode: {
					return fail(400, {
						success: false,
						data: formDataParseResult,
						errorType: confirmResult.error.type,
						errorMessage: confirmResult.error.message
					} satisfies FormFail<typeof formDataParseResult>);
				}
				case UnexpectedErrorType: {
					throw error(500, confirmResult.error);
				}
			}
		}

		return { success: true };
	}
};
