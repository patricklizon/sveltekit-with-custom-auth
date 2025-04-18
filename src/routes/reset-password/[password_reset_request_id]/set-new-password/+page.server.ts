import { fail, type Actions } from '@sveltejs/kit';

import { UserErrorType } from '$lib/domain/user';
import { resetPasswordSetNewPasswordFormDataSchema } from '$lib/shared/infrastructure/validators';
import type { FormParseFail } from '$lib/types';

// TODO: Finish implementation
export const actions: Actions = {
	default: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const formDataParseResult =
			await resetPasswordSetNewPasswordFormDataSchema.safeParseAsync(formData);

		if (!formDataParseResult.success) {
			return fail(400, {
				success: false,
				data: formDataParseResult,
				errorType: UserErrorType.Validation,
				errorByFieldName: formDataParseResult.error.flatten().fieldErrors
			} satisfies FormParseFail);
		}

		return {
			success: true
		};
	}
};
