import { err, ok, type Result } from 'neverthrow';

import { resolveRoute } from '$app/paths';
import { ValidationError } from '$lib/errors';
import type { Option } from '$lib/types';
import { isEmpty, isNothing } from '$lib/utils';

/**
 * Extracts parameter names from a route path
 *
 * @example
 * ```ts
 * RawPathParam<'/users/[id]/posts/[postId]'> // -> 'id' | 'postId'
 * ```
 */
type RawPathParam<R extends string> = R extends `${infer Letter}${infer Rest}`
	? Letter extends '['
		? Rest extends `${infer Param}]${infer Remaining}`
			? Param | RawPathParam<Remaining>
			: never
		: RawPathParam<Rest>
	: never;

/** Route parameter regex with named capturing groups */
const ROUTE_PARAM_REGEX = /\[(?<param>.*?)\]/g;

/**
 * Creates a type-safe route path with optional parameters
 */
export function createRoutePath<
	R extends string,
	K extends RawPathParam<R>,
	P extends Record<K, Option<string>>
>(route: R, paramsRequiredByRoute: P): Result<string, ValidationError> {
	const matchedParams = route.match(ROUTE_PARAM_REGEX);
	const isParamOptional = isNothing(matchedParams) || !matchedParams.length;
	if (isParamOptional) return ok(resolveRoute(route, {}));

	const resultParams: Record<string, string> = {};
	const invalidParams: Record<string, Option<string>> = {};
	let key: Option<string>;
	let value: Option<string>;
	for (const match of matchedParams) {
		key = match.slice(1, match.length - 1);
		value = paramsRequiredByRoute[key as K]?.trim();

		if (isNothing(value) || isEmpty(value)) invalidParams[key] = value;
		else resultParams[key] = encodeURIComponent(value);
	}

	return Object.keys(invalidParams).length
		? err(new ValidationError('Invalid or missing parameter values', invalidParams))
		: ok(resolveRoute(route, resultParams));
}
