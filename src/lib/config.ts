import type { Language } from './domain/language';

export const templateConfig = createTemplateConfig({
	mainLanguage: 'en' as Language,
	supportedLanguages: new Set(['en']) as Set<Language>
});

type TemplateConfig = {
	mainLanguage: Language;
	supportedLanguages: Set<Language>;
};

function createTemplateConfig(config: TemplateConfig): TemplateConfig {
	if (!config.supportedLanguages.has(config.mainLanguage)) {
		throw new Error('Main language is not in the set of supported languages');
	}

	return config;
}
