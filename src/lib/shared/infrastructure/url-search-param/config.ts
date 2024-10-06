import { UrlSearchParamName } from './types';

import type { Enum } from '$lib/types';

/**
 * Mappings between URL search parameter names and their in URL display names.
 *
 * @example
 * ```typescript
 * const url = new URL('https://example.com')
 *
 * url.searchParams.set(UrlSearchParamName.Redirect, '/some/path')
 *
 * // creates: URL with 'r' parameter (not encoded)
 * // 'https://example.com?r=/some/path'
 *
 * url.searchParams.get(UrlSearchParamName.Redirect)
 * // returns: '/some/path'
 *```
 */
export const urlSearchParamDisplayNameByUrlSearchParamName = {
	[UrlSearchParamName.Redirect]: 'r'
} satisfies Record<UrlSearchParamName, string>;

export const UrlSearchParamStrategy = {
	ApplicationUrl: 'url-search-param-set-strategy/ApplicationUrl',
	Primitive: 'url-search-param-set-strategy/Primitive'
} as const;

export type UrlSearchParamStrategy = Enum<typeof UrlSearchParamStrategy>;

export const sep = ':';

export const SerializationPrefix = {
	String: `string${sep}`,
	Number: `number${sep}`,
	Boolean: `boolean${sep}`,
	AppRoute: `appRoute${sep}`
} as const;

export type SerializationPrefix = Enum<typeof SerializationPrefix>;
