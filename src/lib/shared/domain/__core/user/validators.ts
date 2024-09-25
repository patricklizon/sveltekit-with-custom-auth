import { z } from 'zod';
import { safeCastId } from '$lib/shared/domain/__core/id';

import type {
	UserConfirmResetPasswordFormData,
	UserInitializeResetPasswordFormData,
	UserLoginWithCredentialsFormData,
	UserPasswordResetRequestId,
	UserPlainTextPassword,
	UserRegisterWithCredentialsFormData
} from './types';

/**
 * Schema used for validating registration form
 */
export const userRegistrationWithCredentialsDataSchema = z
	.object({
		email: z
			.string()
			.email('Invalid email address')
			.transform((v) => v.toLowerCase()),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.transform((v) => safeCastId<UserPlainTextPassword, string>(v)),
		passwordConfirmation: z.string().transform((v) => safeCastId<UserPlainTextPassword, string>(v))
	} satisfies Record<keyof UserRegisterWithCredentialsFormData, unknown>)
	.refine((val) => val.password === val.passwordConfirmation, {
		message: "Passwords don't match",
		path: ['passwordConfirmation']
	});

/**
 * Schema used for validating login form
 */
export const userLoginWithCredentialsDataSchema = z.object({
	email: z
		.string()
		.min(1)
		.email('Invalid email address')
		.transform((v) => v.toLowerCase()),
	password: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserPlainTextPassword, string>(v))
} satisfies Record<keyof UserLoginWithCredentialsFormData, unknown>);

/**
 * Schema used for form initializing password reset
 */
export const userInitializePasswordResetDataSchema = z.object({
	email: z
		.string()
		.min(1)
		.email('Invalid email address')
		.transform((v) => v.toLowerCase())
} satisfies Record<keyof UserInitializeResetPasswordFormData, unknown>);

/**
 * Schema used for confirming password reset
 */
export const userConfirmPasswordResetDataSchema = z.object({
	passwordResetRequestId: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserPasswordResetRequestId, string>(v)),
	otp: z.string().min(1)
} satisfies Record<keyof UserConfirmResetPasswordFormData, unknown>);
