import { safeCastId } from '$lib/shared/domain/__core/id';
import type { UserPlainTextOTP } from '$lib/shared/domain/__core/user';
import type { UserRequestId } from '$lib/shared/domain/__core/user-request';
import { z } from 'zod';

/**
 * Schema for form confirming user request
 */
export const userRequestConfirmFormDataSchema = z.object({
	otp: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserPlainTextOTP, string>(v)),
	requestId: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserRequestId, string>(v))
});
