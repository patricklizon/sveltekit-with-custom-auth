import type { Enum } from '$lib/types';

export const UrlSearchParamName = {
	Redirect: 'url-search-param/Redirect'
} as const;

export type UrlSearchParamName = Enum<typeof UrlSearchParamName>;
