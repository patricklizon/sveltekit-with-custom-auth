import { fail, error, redirect, type Actions } from '@sveltejs/kit';

import { resolveRoute } from '$app/paths';
import { UserErrorType } from '$lib/domain/user';
import { UnexpectedErrorType } from '$lib/errors';
import { RawPath } from '$lib/routes';
import { OTPService } from '$lib/server/infrastructure/otp';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { UserRepository } from '$lib/server/infrastructure/user';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';
import { CreatePasswordResetRequestUseCase } from '$lib/server/use-cases/user';
import { resetPasswordStartProcessFormDataSchema } from '$lib/shared/infrastructure/validators';
import type { FormFail, FormParseFail } from '$lib/types';

const otpService = new OTPService();
const hasher = new PasswordHashingService();
const userRequestRepository = new UserRequestRepository(hasher);
const userRepository = new UserRepository(hasher);
const createPasswordResetRequest = new CreatePasswordResetRequestUseCase(
	userRepository,
	userRequestRepository,
	otpService
);

export const actions: Actions = {
	default: async ({ request }) => {
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
