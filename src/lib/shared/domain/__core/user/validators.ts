import { z } from 'zod';
import { safeCastId } from '$lib/shared/domain/__core/id';

import type {
	UserLoginWithCredentialsFormData,
	UserPlainTextPassword,
	UserRegisterWithCredentialsFormData
} from './types';

/**
 * Schema used for validating registration form
 */
export const userRegistrationWithCredentialsDataSchema = z
	.object({
		email: z.string().email('Invalid email address'),
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
	email: z.string().min(1).email('Invalid email address'),
	password: z
		.string()
		.min(1)
		.transform((v) => safeCastId<UserPlainTextPassword, string>(v))
} satisfies Record<keyof UserLoginWithCredentialsFormData, unknown>);
