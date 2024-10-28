/*
 * User-related error types and custom error classes.
 *
 * Defines:
 * - Enum of user error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import type { User } from './types';

import { BaseError } from '$lib/errors';
import type { Enum } from '$lib/types';
export const UserErrorType = {
	AlreadyExists: 'domain/user/error/AlreadyExists',
	NonExisting: 'domain/user/error/NonExisting',
	EmailAlreadyVerified: 'domain/user/error/EmailAlreadyVerified',
	InvalidPassword: 'domain/user/error/InvalidPassword',
	DataCorruption: 'domain/user/error/DataCorruption',
	Validation: 'domain/user/error/Validation'
} as const;

export type UserErrorType = Enum<typeof UserErrorType>;

export class UserValidationError extends BaseError<typeof UserErrorType.Validation> {
	constructor(message: string) {
		super(UserErrorType.Validation, message);
	}
}

export class UserAlreadyExistsError extends BaseError<
	typeof UserErrorType.AlreadyExists,
	{ email: string }
> {
	constructor(email: string) {
		super(UserErrorType.AlreadyExists, `User with email ${email} already exists`, { email });
	}
}

export class UserDoesNotExistsError extends BaseError<
	typeof UserErrorType.NonExisting,
	{ identifier: User['email'] | User['id'] }
> {
	constructor(identifier: User['email'] | User['id']) {
		super(UserErrorType.NonExisting, 'User does not exists', { identifier });
	}
}

export class UserEmailAlreadyVerifiedError extends BaseError<
	typeof UserErrorType.EmailAlreadyVerified,
	{ identifier: User['id'] }
> {
	constructor(identifier: User['id']) {
		super(UserErrorType.EmailAlreadyVerified, 'Email is already verified', { identifier });
	}
}

export class UserInvalidPasswordError extends BaseError<typeof UserErrorType.InvalidPassword> {
	constructor() {
		super(UserErrorType.InvalidPassword, 'Invalid password');
	}
}

export class UserCorruptionError extends BaseError<typeof UserErrorType.DataCorruption, unknown> {
	constructor(message: string, data?: unknown) {
		super(UserErrorType.DataCorruption, message, data);
	}
}
