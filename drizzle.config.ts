import z from 'zod';
import { defineConfig } from 'drizzle-kit';
import path from 'node:path';

const dbCredentialsSchema = z.object({
	DB_URL: z.string()
});

const PERSISTANCE_URL = path.resolve(__dirname, './src/lib/server/infrastructure/persistance');

const dbCredentials = dbCredentialsSchema.parse(process.env);

export default defineConfig({
	schema: path.resolve(PERSISTANCE_URL, './schemas/index.ts'),
	out: path.resolve(PERSISTANCE_URL, './migrations'),
	dialect: 'sqlite',
	dbCredentials: {
		url: dbCredentials.DB_URL
	},
	strict: true,
	verbose: true
});
