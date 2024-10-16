import type { Result } from 'neverthrow';

import { UrlSearchParamStrategy } from './config';
import type { UrlSearchParamDeserializationError } from './errors';
import { readUrlSearchParam } from './reader';
import { UrlSearchParamName } from './types';

import type { Option } from '$lib/types';

export function readRedirectSearchParam(
	param: URL
): Result<Option<string>, UrlSearchParamDeserializationError> {
	return readUrlSearchParam(UrlSearchParamStrategy.ApplicationUrl, {
		paramName: UrlSearchParamName.Redirect,
		url: param
	});
}
