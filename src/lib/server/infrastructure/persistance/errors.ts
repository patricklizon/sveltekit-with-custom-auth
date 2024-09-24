import type { Enum } from '$lib/types';

export const DatabaseErrorType = {
	Read: 'database/error/Read',
	Write: 'database/error/Write',
	EntityNotFound: 'database/error/EntityNotFound'
} as const;

export type DatabaseErrorType = Enum<typeof DatabaseErrorType>;

export class DatabaseReadError extends Error {
	constructor(public error: unknown) {
		super('An error occurred while accessing the database');

		this.name = DatabaseErrorType.Read;

		if (error instanceof Error && error.stack) {
			this.stack = `${this.stack}\nCaused by: ${error.stack}`;
		}
	}

	readonly type = DatabaseErrorType.Read;
}

export class DatabaseWriteError extends Error {
	constructor(public error: unknown) {
		super('An error occurred while writing the database');

		this.name = DatabaseErrorType.Write;

		if (error instanceof Error && error.stack) {
			this.stack = `${this.stack}\nCaused by: ${error.stack}`;
		}
	}

	readonly type = DatabaseErrorType.Write;
}

export class DatabaseEntityNotFoundError extends Error {
	constructor(entityName: string, identifierDetails: string) {
		super(`${entityName} not found: ${identifierDetails}`);
		this.name = DatabaseErrorType.EntityNotFound;
	}

	readonly type = DatabaseErrorType.EntityNotFound;
}
