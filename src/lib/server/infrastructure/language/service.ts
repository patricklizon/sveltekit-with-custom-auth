import { AcceptLanguageHeaderParser } from './accept-language-header-parser';

import { templateConfig } from '$lib/config';
import type { Language } from '$lib/domain/language';
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

	setLanguageCookie(input: Readonly<{ cookies: Cookies; language: Language }>): void {
		input.cookies.set(this.languageCookieName, input.language, {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD
		});
	}

	getMainLanguage(): Language {
		return this.mainLanguage;
	}

	/**
	 * Checks if a given language is supported.
	 */
	isLanguageSupported(language: string): language is Language {
		return this.supportedLanguages.has(language as Language);
	}

	getLanguageFromCookie(input: { cookies: Cookies }): Option<Language> {
		const cookie = input.cookies.get(this.languageCookieName);
		if (cookie && this.isLanguageSupported(cookie)) return cookie;
		return undefined;
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
