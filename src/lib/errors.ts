/**
 * This file defines custom error classes for better error handling in a domain-driven design context.
 * It provides a base `DomainError` class for specific domain errors and an `UnexpectedError` class for wrapping unknown errors.
 */

import type { Option, Nothing } from './types';

/**
 * Abstract base class for domain-specific errors.
 *
 * It's useful for creating a hierarchy of domain-specific errors that can carry additional context.
 */
export abstract class DomainError<
	TErrorType extends string,
	TData extends Option<Record<string, unknown>> | unknown = Nothing
> extends Error {
	constructor(
		readonly type: TErrorType,
		readonly data: TData,
		message?: string
	) {
		super(message ?? `Domain error of type: ${type}`);
		this.name = type;
		this.type = type;
		this.data = data;
	}
}

export const UnexpectedErrorType = 'unexpected';
export type UnexpectedErrorType = typeof UnexpectedErrorType;

/**
 * Wrapper for unexpected errors that occur during runtime.
 *
 * This class is useful for catching and standardizing unknown errors that may occur in the application.
 * It preserves the original error while providing a consistent interface for error handling.
 */
export class UnexpectedError extends Error {
	public readonly originalError: unknown;

	constructor(error: unknown) {
		const message = UnexpectedError.getErrorMessage(error);
		super(message);
		this.name = 'UnexpectedError';
		this.originalError = error;

		// Preserve the stack trace
		if ('captureStackTrace' in Error) {
			Error.captureStackTrace(this, UnexpectedError);
		}

		// Ensure 'instanceof' works correctly
		Object.setPrototypeOf(this, UnexpectedError.prototype);
	}

	readonly type = 'unexpected';

	/**
	 * Extracts a string message from the given error.
	 *
	 * @param error - The original error object
	 * @returns A string representation of the error message
	 */
	private static getErrorMessage(error: unknown): string {
		if (error instanceof Error) return error.message;
		return String(error);
	}
}
