import path from 'node:path';

import { defineConfig } from 'drizzle-kit';
import z from 'zod';

const dbCredentialsSchema = z.object({
	DB_URL: z.string().min(1, 'Database URL is required')
});

const ROOT_DIR = process.cwd(); // Use current working directory
const PERSISTENCE_DIR = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'server',
	'infrastructure',
	'persistance'
);
const SCHEMA_PATH = path.join(PERSISTENCE_DIR, 'schemas', 'index.ts');
const MIGRATIONS_PATH = path.join(PERSISTENCE_DIR, 'migrations');

const dbCredentials = dbCredentialsSchema.parse(process.env);

export default defineConfig({
	schema: SCHEMA_PATH,
	out: MIGRATIONS_PATH,
	dialect: 'sqlite',
	dbCredentials: {
		url: dbCredentials.DB_URL
	},
	strict: true,
	verbose: true,
	casing: 'snake_case'
});
