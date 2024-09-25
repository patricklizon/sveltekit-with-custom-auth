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
import type { User, UserPasswordResetRequest } from './types';
export const UserErrorType = {
	InvalidData: 'domain/user/error/InvalidData',
	AlreadyExists: 'domain/user/error/AlreadyExists',
	NonExisting: 'domain/user/error/NonExisting',
	InvalidPassword: 'domain/user/error/InvalidPassword',
	DataCorruption: 'domain/user/error/DataCorruption',
	Validation: 'domain/user/error/Validation',
	PasswordResetRequestExpired: 'domain/user/error/PasswordResetRequestExpired',
	PasswordResetRequestNonVerified: 'domain/user/error/PasswordResetRequestNonVerified',
	PasswordResetRequestNonExisting: 'domain/user/error/PasswordResetRequestNonExisting',
	PasswordResetRequestInvalidCode: 'domain/user/error/PasswordResetRequestInvalidCode'
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
	{ identifier: User['email'] | User['id'] }
> {
	constructor(identifier: User['email'] | User['id']) {
		super(UserErrorType.NonExisting, { identifier }, 'User does not exists');
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

export class UserPasswordResetRequestExpiredError extends DomainError<
	typeof UserErrorType.PasswordResetRequestExpired,
	{ expiredAt: Date }
> {
	constructor(expiredAt: Date) {
		super(
			UserErrorType.PasswordResetRequestExpired,
			{ expiredAt },
			// TODO: format date
			`Token expired at ${expiredAt.getTime()}`
		);
	}
}

export class UserPasswordResetRequestNonExistingError extends DomainError<
	typeof UserErrorType.PasswordResetRequestNonExisting,
	{ passwordResetRequestId: UserPasswordResetRequest['id'] }
> {
	constructor(passwordResetRequestId: UserPasswordResetRequest['id']) {
		super(UserErrorType.PasswordResetRequestNonExisting, { passwordResetRequestId });
	}
}

export class UserPasswordResetRequestInvalidCodeError extends DomainError<
	typeof UserErrorType.PasswordResetRequestInvalidCode,
	{ passwordResetRequestId: UserPasswordResetRequest['id']; otp: UserPasswordResetRequest['otp'] }
> {
	constructor(
		passwordResetRequestId: UserPasswordResetRequest['id'],
		otp: UserPasswordResetRequest['otp']
	) {
		super(
			UserErrorType.PasswordResetRequestInvalidCode,
			{ passwordResetRequestId, otp },
			`Entered code is invalid`
		);
	}
}

export class UserPasswordResetRequestNonVerifiedError extends DomainError<
	typeof UserErrorType.PasswordResetRequestNonVerified,
	{ passwordResetRequestId: UserPasswordResetRequest['id'] }
> {
	constructor(passwordResetRequestId: UserPasswordResetRequest['id']) {
		super(
			UserErrorType.PasswordResetRequestNonVerified,
			{ passwordResetRequestId },
			'Password change request was not verified.'
		);
	}
}
