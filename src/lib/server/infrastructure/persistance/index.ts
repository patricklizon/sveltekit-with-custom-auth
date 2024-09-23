import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import sqlite from 'better-sqlite3';

export * from './errors';
export * from './schemas';

export const database = drizzle(sqlite(env.DB_URL));
