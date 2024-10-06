/*
 * UserRequest-related error types and custom error classes.
 *
 * Defines:
 * - Enum of user error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import type { UserRequest } from './type';

import { DomainError } from '$lib/errors';
import type { Enum } from '$lib/types';

export const UserRequestErrorType = {
	Expired: 'domain/user-request/error/Expired',
	NotConfirmed: 'domain/user-request/error/NotConfirmed',
	NonExisting: 'domain/user-request/error/NonExisting',
	InvalidVerificationCode: 'domain/user-request/error/InvalidVerificationCode'
} as const;

export type UserRequestErrorType = Enum<typeof UserRequestErrorType>;

export class UserRequestExpiredError extends DomainError<
	typeof UserRequestErrorType.Expired,
	{ expiredAt: Date }
> {
	constructor(expiredAt: Date) {
		super(
			UserRequestErrorType.Expired,
			{ expiredAt },
			// TODO: format date
			`Token expired at ${expiredAt.getTime()}`
		);
	}
}

export class UserRequestNonExistingError extends DomainError<
	typeof UserRequestErrorType.NonExisting,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(UserRequestErrorType.NonExisting, { userRequestId });
	}
}

export class UserRequestInvalidCodeError extends DomainError<
	typeof UserRequestErrorType.InvalidVerificationCode,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(
			UserRequestErrorType.InvalidVerificationCode,
			{ userRequestId },
			`Entered code is invalid`
		);
	}
}

export class UserRequestNonConfirmedError extends DomainError<
	typeof UserRequestErrorType.NotConfirmed,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(
			UserRequestErrorType.NotConfirmed,
			{ userRequestId },
			'Password change request was not verified.'
		);
	}
}
