import type { Language } from '$lib/domain/language';
import { AcceptLanguageHeaderParser } from '$lib/server/infrastructure/language';

type UseCaseInput = Readonly<{
	header: string;
}>;

type UseCaseResult = Language;

export class DetermineUserLanguagePreferenceUseCase {
	constructor(private parser: AcceptLanguageHeaderParser) {}

	execute(input: UseCaseInput): UseCaseResult {
		const [{ language }] = this.parser.parse(input.header);
		return language;
	}
}
