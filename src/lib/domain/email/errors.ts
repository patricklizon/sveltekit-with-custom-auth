/*
 * Email-related error types and custom error classes.
 *
 * Defines:
 * - Enum of email error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import { BaseError } from '$lib/errors';
import type { Enum } from '$lib/types';
export const EmailErrorType = {
	Rejected: 'domain/email/error/Rejected'
} as const;

export type EmailErrorType = Enum<typeof EmailErrorType>;

export class EmailRejectedError extends BaseError<
	typeof EmailErrorType.Rejected,
	{ rejectedBy: string[] | string }
> {
	constructor(rejectedBy: string[]) {
		super(EmailErrorType.Rejected, 'Email was rejected.', { rejectedBy });
	}
}
