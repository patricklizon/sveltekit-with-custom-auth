import { err, ok, Result } from 'neverthrow';

import { AcceptLanguageHeaderParser } from './accept-language-header-parser';

import { templateConfig } from '$lib/config';
import { LanguageNotSupportedError, type Language } from '$lib/domain/language';
import type { Cookies, Option } from '$lib/types';

export class LanguageService {
	constructor(
		private headerParser = new AcceptLanguageHeaderParser(
			templateConfig.supportedLanguages,
			templateConfig.mainLanguage
		),
		private supportedLanguages = templateConfig.supportedLanguages,
		private mainLanguage = templateConfig.mainLanguage
	) {}

	private readonly languageCookieName = 'language';

	setLanguageCookie(
		input: Readonly<{ cookies: Cookies; language: Language }>
	): Result<{ success: true }, LanguageNotSupportedError> {
		if (!this.isSupportedLanguage(input.language)) {
			return err(new LanguageNotSupportedError(input.language));
		}

		input.cookies.set(this.languageCookieName, input.language, {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD
		});

		return ok({ success: true });
	}

	getMainLanguage(): Language {
		return this.mainLanguage;
	}

	/**
	 * Checks if a given language is supported.
	 */
	private isSupportedLanguage(language: string): language is Language {
		return this.supportedLanguages.has(language as Language);
	}

	getLanguageFromCookie(input: {
		cookies: Cookies;
	}): Result<Option<Language>, LanguageNotSupportedError> {
		const cookie = input.cookies.get(this.languageCookieName);
		if (!cookie) return ok(undefined);
		if (this.isSupportedLanguage(cookie)) return ok(cookie);
		return err(new LanguageNotSupportedError(cookie));
	}

	getLanguageFromAcceptLanguageHeader(input: { headers: Headers }): Option<Language> {
		const header = input.headers.get('Accept-Language') ?? '';
		const parsedHeader = this.headerParser.parse(header);
		for (const { language } of parsedHeader) {
			if (this.supportedLanguages.has(language)) return language;
		}
		return undefined;
	}
}
