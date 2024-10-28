import type { Nothing } from './types';

export function isNothing(v: unknown): v is Nothing {
	return v === null || v === undefined;
}

export function isEmpty(v: { length: number } | { size: number } | string): boolean {
	if (typeof v === 'string') return !v.length;
	if ('size' in v) return !v.size;
	return !v.length;
}
