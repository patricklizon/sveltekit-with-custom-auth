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

import { BaseError } from '$lib/errors';
import type { Enum } from '$lib/types';

export const UserRequestErrorType = {
	Expired: 'domain/user-request/error/Expired',
	NotConfirmed: 'domain/user-request/error/NotConfirmed',
	NonExisting: 'domain/user-request/error/NonExisting',
	InvalidVerificationCode: 'domain/user-request/error/InvalidVerificationCode'
} as const;

export type UserRequestErrorType = Enum<typeof UserRequestErrorType>;

export class UserRequestExpiredError extends BaseError<
	typeof UserRequestErrorType.Expired,
	{ expiredAt: Date }
> {
	constructor(expiredAt: Date) {
		super(
			UserRequestErrorType.Expired,
			// TODO: format date
			`Token expired at ${expiredAt.getTime()}`,
			{ expiredAt }
		);
	}
}

export class UserRequestNonExistingError extends BaseError<
	typeof UserRequestErrorType.NonExisting,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(UserRequestErrorType.NonExisting, 'User request does not exists.', { userRequestId });
	}
}

export class UserRequestInvalidCodeError extends BaseError<
	typeof UserRequestErrorType.InvalidVerificationCode,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(UserRequestErrorType.InvalidVerificationCode, `Entered code is invalid`, {
			userRequestId
		});
	}
}

export class UserRequestNonConfirmedError extends BaseError<
	typeof UserRequestErrorType.NotConfirmed,
	{ userRequestId: UserRequest['id'] }
> {
	constructor(userRequestId: UserRequest['id']) {
		super(UserRequestErrorType.NotConfirmed, 'Password change request was not verified.', {
			userRequestId
		});
	}
}
