import { z } from 'zod';

import { confirmPasswordSchema } from './units/auth';

export const userRegistrationWithCredentialsFormDataSchema = z.intersection(
	confirmPasswordSchema,
	z.object({
		email: z
			.string()
			.min(1)
			.email('Invalid email address')
			.transform((v) => v.toLowerCase())
	})
);
