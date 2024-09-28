import { z } from 'zod';
import { userEmailSchema, userPasswordSchema } from './units/auth';

export const loginWithCredentialsFormDataSchema = z.object({
	email: userEmailSchema,
	password: userPasswordSchema
});
