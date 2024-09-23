import { SQL, sql } from 'drizzle-orm';

export function sqlCurrentTimeStamp(): SQL<Date> {
	return sql`(current_timestamp)`;
}

export function sqlDefaultCreatedAt(): SQL<Date> {
	return sqlCurrentTimeStamp();
}

export function sqlDefaultUpdatedAt(): SQL<Date> {
	return sqlCurrentTimeStamp();
}
