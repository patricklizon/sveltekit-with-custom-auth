import { z } from 'zod';

import { confirmPasswordSchema, userEmailSchema } from './units/auth';

import { safeCastId } from '$lib/domain/id';
import type { UserPlainTextOTP } from '$lib/domain/user';
import type { UserRequestId } from '$lib/domain/user-request';

/**
 * Schema for form initializing password reset process
 */
export const resetPasswordStartProcessFormDataSchema = z.object({
	email: userEmailSchema
});

/**
 * Schema for form confirming user request
 */
export const resetPasswordConfirmRequestFormDataSchema = z.object({
	otp: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserPlainTextOTP, string>(v)),
	passwordResetRequestId: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserRequestId, string>(v))
});

/**
 * Schema for final step in the password reset process
 */
export const resetPasswordSetNewPasswordFormDataSchema = confirmPasswordSchema;
