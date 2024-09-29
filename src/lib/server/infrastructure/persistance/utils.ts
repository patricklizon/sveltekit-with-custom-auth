// import { SQL, sql } from 'drizzle-orm';

export function sqlCurrentTimeStamp(): Date {
	return new Date();
}

export function sqlDefaultCreatedAt(): Date {
	return sqlCurrentTimeStamp();
}

export function sqlDefaultUpdatedAt(): Date {
	return sqlCurrentTimeStamp();
}
