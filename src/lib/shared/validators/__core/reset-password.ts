import { safeCastId } from '$lib/shared/domain/__core/id';
import type { UserRequestId } from '$lib/shared/domain/__core/user-request';
import { z } from 'zod';
import { confirmPasswordSchema, userEmailSchema } from './units/auth';

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
	otp: z.string().min(1),
	passwordResetRequestId: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserRequestId, string>(v))
});

/**
 * Schema for final step in the password reset process
 */
export const resetPasswordSetNewPasswordFormDataSchema = confirmPasswordSchema;
