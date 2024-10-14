import { z } from 'zod';

import { safeCastId } from '$lib/domain/id';
import type { UserPlainTextOTP } from '$lib/domain/user';
import type { UserRequestId } from '$lib/domain/user-request';

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
