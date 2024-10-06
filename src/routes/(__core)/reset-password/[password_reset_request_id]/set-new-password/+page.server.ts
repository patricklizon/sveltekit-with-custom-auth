import { fail, type Actions } from '@sveltejs/kit';

import { UserErrorType } from '$lib/shared/domain/__core/user';
import { resetPasswordSetNewPasswordFormDataSchema } from '$lib/shared/validators/__core';
import type { FormParseFail } from '$lib/types';

// TODO: Finish implementation
export const actions: Actions = {
	deafult: async ({ request }) => {
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
	}
};
