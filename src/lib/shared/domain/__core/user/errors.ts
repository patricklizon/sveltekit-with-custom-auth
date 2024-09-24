/*
 * User-related error types and custom error classes.
 *
 * Defines:
 * - Enum of user error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import { DomainError } from '$lib/errors';
import type { Enum } from '$lib/types';

export const UserErrorType = {
	InvalidData: 'domain/user/error/InvalidData',
	AlreadyExists: 'domain/user/error/AlreadyExists',
	NonExisting: 'domain/user/error/NonExisting',
	InvalidPassword: 'domain/user/error/InvalidPassword',
	DataCorruption: 'domain/user/error/DataCorruption',
	Validation: 'domain/user/error/Validation'
} as const;

export type UserErrorType = Enum<typeof UserErrorType>;

export class UserInvalidDataError extends DomainError<typeof UserErrorType.InvalidData> {
	constructor(message: string) {
		super(UserErrorType.InvalidData, undefined, message);
	}
}

export class UserAlreadyExistsError extends DomainError<
	typeof UserErrorType.AlreadyExists,
	{ email: string }
> {
	constructor(email: string) {
		super(UserErrorType.AlreadyExists, { email }, `User with email ${email} already exists`);
	}
}

export class UserDoesNotExistsError extends DomainError<
	typeof UserErrorType.NonExisting,
	{ email: string }
> {
	constructor(email: string) {
		super(UserErrorType.NonExisting, { email }, `User with email ${email} does not exists`);
	}
}

export class UserInvalidPasswordError extends DomainError<typeof UserErrorType.InvalidPassword> {
	constructor() {
		super(UserErrorType.InvalidPassword, undefined, 'Invalid password');
	}
}

export class UserAccountCorruptionError extends DomainError<
	typeof UserErrorType.DataCorruption,
	unknown
> {
	constructor(message: string, data?: unknown) {
		super(UserErrorType.DataCorruption, data, message);
	}
}
