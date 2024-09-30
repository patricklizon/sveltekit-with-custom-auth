import { z } from 'zod';
import { userEmailSchema, loginPasswordSchema } from './units/auth';

export const loginWithCredentialsFormDataSchema = z.object({
	email: userEmailSchema,
	password: loginPasswordSchema
});
