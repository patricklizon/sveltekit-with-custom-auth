import sqlite from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { env } from '$env/dynamic/private';

// import { env as p } from '$env/dynamic/public';
// import Database from 'better-sqlite3';

export const database =
	process.env['NODE_ENV'] === 'test'
		? createTestDatabase()
		: drizzle(sqlite(env.DB_URL), { casing: 'snake_case' });

export type DB = typeof database;

export type TX = Parameters<Parameters<typeof database.transaction>[0]>[0];

function createTestDatabase(): BetterSQLite3Database {
	const db = drizzle(sqlite(':memory:'), { casing: 'snake_case' });

	migrate(db, { migrationsFolder: './migrations' });

	return db;
}
