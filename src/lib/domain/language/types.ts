import type { Id } from '../id';

export type Language = Id<'language'>;

export type LanguagePreference = { language: Language; quality: number };
