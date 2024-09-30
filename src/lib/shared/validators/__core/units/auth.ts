import { safeCastId } from '$lib/shared/domain/__core/id';
import type { UserPlainTextPassword } from '$lib/shared/domain/__core/user';
import { z } from 'zod';

export const userEmailSchema = z
	.string()
	.min(1)
	.email('Invalid email address')
	.transform((v) => v.toLowerCase());

export const loginPasswordSchema = z
	.string()
	.min(1)
	.transform((v) => safeCastId<UserPlainTextPassword, string>(v));

export const registerPasswordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.transform((v) => safeCastId<UserPlainTextPassword, string>(v));

export const confirmPasswordSchema = z
	.object({
		password: registerPasswordSchema,
		passwordConfirmation: registerPasswordSchema
	})
	.refine((val) => val.password === val.passwordConfirmation, {
		message: "Passwords don't match",
		path: ['passwordConfirmation']
	});
