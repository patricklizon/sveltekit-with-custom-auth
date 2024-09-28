import { DomainError } from '$lib/errors';
import type { Enum } from '$lib/types';
export const EmailErrorType = {
	Rejected: 'domain/email/error/Rejected'
} as const;

export type EmailErrorType = Enum<typeof EmailErrorType>;

export class EmailRejectedError extends DomainError<
	typeof EmailErrorType.Rejected,
	{ rejectedBy: string[] | string }
> {
	constructor(rejectedBy: string[]) {
		super(EmailErrorType.Rejected, { rejectedBy }, 'Email was rejected.');
	}
}
