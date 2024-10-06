import { fail, error, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { PasswordHasher, TwoFactor } from '$lib/server/infrastructure/__core/security';
import { CreatePasswordResetRequestUseCase } from '$lib/server/modules/__core/user/use-cases/create-password-reset-request';
import { UserErrorType } from '$lib/shared/domain/__core/user';
import { resetPasswordStartProcessFormDataSchema } from '$lib/shared/validators/__core/';
import type { FormFail, FormParseFail } from '$lib/types';

const twoFactor = new TwoFactor();
const hasher = new PasswordHasher();

const createPasswordResetRequest = new CreatePasswordResetRequestUseCase(twoFactor, hasher);

export const actions: Actions = {
	deafult: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult =
			await resetPasswordStartProcessFormDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formDataParseResult,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		const result = await createPasswordResetRequest.execute({
			email: formDataParseResult.data.email
		});

		if (result.isErr()) {
			switch (result.error.type) {
				case UserErrorType.NonExisting: {
					return fail(400, {
						success: false,
						data: result.error.data,
						errorType: UserErrorType.NonExisting,
						errorMessage: result.error.message
					} satisfies FormFail<typeof result.error.data>);
				}

				case UnexpectedErrorType: {
					throw error(500, result.error);
				}
			}
		}

		throw redirect(
			302,
			resolveRoute(RawPath.ResetPasswordVerify, { passwordResetRequestId: result.value })
		);
	}
};
