import sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { env } from '$env/dynamic/private';

export * from './errors';
export * from './schemas';
export * from './utils';

export const database = drizzle(sqlite(env.DB_URL));
export type DB = typeof database;
export type TX = Parameters<Parameters<typeof database.transaction>[0]>[0];
