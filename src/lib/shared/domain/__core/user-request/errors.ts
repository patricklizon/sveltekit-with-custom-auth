/*
 * UserRequest-related error types and custom error classes.
 *
 * Defines:
 * - Enum of user error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import { DomainError } from '$lib/errors';
import type { Enum } from '$lib/types';
import type { UserRequest } from './type';

export const UserRequestErrorType = {
	Expired: 'domain/user-request/error/Expired',
	NonConfirmed: 'domain/user-request/error/NonConfirmed',
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
	{ passwordResetRequestId: UserRequest['id'] }
> {
	constructor(passwordResetRequestId: UserRequest['id']) {
		super(UserRequestErrorType.NonExisting, { passwordResetRequestId });
	}
}

export class UserRequestInvalidCodeError extends DomainError<
	typeof UserRequestErrorType.InvalidVerificationCode,
	{ passwordResetRequestId: UserRequest['id']; otp: UserRequest['otp'] }
> {
	constructor(passwordResetRequestId: UserRequest['id'], otp: UserRequest['otp']) {
		super(
			UserRequestErrorType.InvalidVerificationCode,
			{ passwordResetRequestId, otp },
			`Entered code is invalid`
		);
	}
}

export class UserRequestNonConfirmedError extends DomainError<
	typeof UserRequestErrorType.NonConfirmed,
	{ passwordResetRequestId: UserRequest['id'] }
> {
	constructor(passwordResetRequestId: UserRequest['id']) {
		super(
			UserRequestErrorType.NonConfirmed,
			{ passwordResetRequestId },
			'Password change request was not verified.'
		);
	}
}
