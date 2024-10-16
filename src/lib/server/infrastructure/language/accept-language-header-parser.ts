import type { Language, LanguagePreference } from '$lib/domain/language';

type ParsedCollection = [first: LanguagePreference, ...rest: LanguagePreference[]];

export class AcceptLanguageHeaderParser {
	constructor(
		private supportedLanguages: Set<Language>,
		private mainLanguage: Language
	) {
		this.defaultPreference = { language: this.mainLanguage, quality: 1 };
	}

	private defaultPreference: LanguagePreference;

	parse(header: string): ParsedCollection {
		const trimmed = header.trim();
		if (!trimmed) {
			return [this.defaultPreference];
		}

		const parsed = trimmed
			.split(',')
			.reduce<LanguagePreference[]>((acc, s) => {
				const [lPart, qPart] = s.trim().split(';');
				if (!lPart) return acc;

				const language = lPart.trim() as Language;
				if (!this.supportedLanguages.has(language)) return acc;

				let quality = 1;
				const qValue = parseFloat(qPart?.split('=')[1] ?? '1');

				if (!isNaN(qValue) && qValue >= 0 && qValue <= 1) {
					quality = qValue;
				}

				acc.push({
					language,
					quality
				});

				return acc;
			}, [])
			.sort((a, b) => b.quality - a.quality);

		if (!parsed.length) return [this.defaultPreference];

		return parsed as ParsedCollection;
	}
}
