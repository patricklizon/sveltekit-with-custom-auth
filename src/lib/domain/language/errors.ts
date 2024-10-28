/*
 * Language-related error types and custom error classes.
 *
 * Defines:
 * - Enum of language error types
 * - Custom error classes
 *
 * All custom errors extend DomainError with specific error types and data.
 */

import { BaseError } from '$lib/errors';
import type { Enum } from '$lib/types';
export const LanguageErrorType = {
	NotSupported: 'domain/language/error/NotSupported'
} as const;

export type LanguageErrorType = Enum<typeof LanguageErrorType>;

export class LanguageNotSupportedError extends BaseError<
	typeof LanguageErrorType.NotSupported,
	{ notSupportedLanguage: string }
> {
	constructor(notSupportedLanguage: string) {
		super(LanguageErrorType.NotSupported, 'Selected language is not supported', {
			notSupportedLanguage
		});
	}
}
