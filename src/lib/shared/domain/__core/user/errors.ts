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
import type { User } from './types';
export const UserErrorType = {
	AlreadyExists: 'domain/user/error/AlreadyExists',
	NonExisting: 'domain/user/error/NonExisting',
	EmailAlreadyVerified: 'domain/user/error/EmailAlreadyVerified',
	InvalidPassword: 'domain/user/error/InvalidPassword',
	DataCorruption: 'domain/user/error/DataCorruption',
	Validation: 'domain/user/error/Validation'
} as const;

export type UserErrorType = Enum<typeof UserErrorType>;

export class UserValidationError extends DomainError<typeof UserErrorType.Validation> {
	constructor(message: string) {
		super(UserErrorType.Validation, undefined, message);
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
	{ identifier: User['email'] | User['id'] }
> {
	constructor(identifier: User['email'] | User['id']) {
		super(UserErrorType.NonExisting, { identifier }, 'User does not exists');
	}
}

export class UserEmailAlreadyVerifiedError extends DomainError<
	typeof UserErrorType.EmailAlreadyVerified,
	{ identifier: User['id'] }
> {
	constructor(identifier: User['id']) {
		super(UserErrorType.EmailAlreadyVerified, { identifier }, 'Email is already verified');
	}
}

export class UserInvalidPasswordError extends DomainError<typeof UserErrorType.InvalidPassword> {
	constructor() {
		super(UserErrorType.InvalidPassword, undefined, 'Invalid password');
	}
}

export class UserCorruptionError extends DomainError<typeof UserErrorType.DataCorruption, unknown> {
	constructor(message: string, data?: unknown) {
		super(UserErrorType.DataCorruption, data, message);
	}
}
