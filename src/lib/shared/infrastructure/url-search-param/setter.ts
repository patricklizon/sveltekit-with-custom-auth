import { mapURLtoAbsoluteUrlPathWithSearchAndFragment, normalizeAbsoluteUrlPath } from './utils';
import {
	urlSearchParamDisplayNameByUrlSearchParamName,
	UrlSearchParamStrategy,
	SerializationPrefix
} from './config';
import { UrlSearchParamName } from './types';
import { UrlSearchParamSerializationError } from './errors';
import { err, ok, type Result } from 'neverthrow';

/**
 * Represents the context for writing URL search parameters.
 */
type UrlSearchParamWriteContext = {
	/** The name of the URL search parameter. */
	paramName: Readonly<UrlSearchParamName>;
	/** The URL to which the parameter will be added. */
	url: Readonly<URL>;
};

/**
 * Defines the return types for different strategies.
 * Workaround used to correctly type `setUrlSearchParam`.
 */
type StrategyReturnType = {
	[UrlSearchParamStrategy.ApplicationUrl]: ReturnType<typeof setApplicationUrlStrategy>;
	[UrlSearchParamStrategy.Primitive]: ReturnType<typeof setPrimitiveStrategy>;
};

/**
 * A mapping of strategy names to their corresponding implementation functions.
 */
const strategyByName = {
	[UrlSearchParamStrategy.ApplicationUrl]: setApplicationUrlStrategy,
	[UrlSearchParamStrategy.Primitive]: setPrimitiveStrategy
} as const;

/**
 * Sets a URL search parameter using the specified strategy.
 */
export function setUrlSearchParam<S extends keyof StrategyReturnType>(
	strategy: S,
	context: Readonly<UrlSearchParamWriteContext>,
	value: Readonly<string>
): StrategyReturnType[S] {
	return strategyByName[strategy](context, value) as unknown as StrategyReturnType[S];
}

///
///
/// STRATEGIES
///
///

/**
 * Assigns correctly formatted application URL to query parameter.
 */
function setApplicationUrlStrategy(
	ctx: Readonly<UrlSearchParamWriteContext>,
	href: Readonly<string>
): URL {
	const result = new URL(ctx.url);
	const absolutePath = mapURLtoAbsoluteUrlPathWithSearchAndFragment(new URL(href, 'http://x'));
	const value = encodeURI(normalizeAbsoluteUrlPath(absolutePath));
	if (!value) return result;

	const displayName = urlSearchParamDisplayNameByUrlSearchParamName[ctx.paramName];
	const serializedValue = SerializationPrefix.AppRoute + value;
	const encodedValue = encodeURIComponent(serializedValue);
	result.searchParams.set(displayName, encodedValue);

	return result;
}

/**
 * Assigns serialized primitive to url.
 */
function setPrimitiveStrategy(
	ctx: Readonly<UrlSearchParamWriteContext>,
	primitive: Readonly<string | number | boolean>
): Result<URL, UrlSearchParamSerializationError> {
	const result = new URL(ctx.url);

	const paramName = urlSearchParamDisplayNameByUrlSearchParamName[ctx.paramName];

	let encodedValue;
	switch (typeof primitive) {
		case 'string': {
			encodedValue = SerializationPrefix.String + primitive;
			break;
		}
		case 'boolean': {
			encodedValue = SerializationPrefix.Boolean + primitive;
			break;
		}
		case 'number': {
			encodedValue = SerializationPrefix.Number + primitive;
			break;
		}
		default: {
			return err(
				new UrlSearchParamSerializationError(
					`Unsupported primitive type: ${typeof primitive}`,
					paramName
				)
			);
		}
	}

	result.searchParams.set(paramName, encodeURIComponent(encodedValue));

	return ok(result);
}
