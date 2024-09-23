import type { Option } from '$lib/types';
import { err, ok, type Result } from 'neverthrow';
import {
	urlSearchParamDisplayNameByUrlSearchParamName,
	UrlSearchParamStrategy,
	SerializationPrefix,
	sep
} from './config';
import type { UrlSearchParamName } from './types';
import { normalizeAbsoluteUrlPath } from './utils';
import { UrlSearchParamDeserializationError } from './errors';

/**
 * Represents the context for reading URL search parameters.
 */
type UrlSearchParamReadContext = {
	/** The name of the URL search parameter. */
	paramName: Readonly<UrlSearchParamName>;
	/** The URL from which the parameter will be read. */
	url: Readonly<URL>;
};

/**
 * Defines the return types for different strategies.
 * Workaround used to correctly type `readUrlSearchParam`.
 */
type StrategyReturnType = {
	[UrlSearchParamStrategy.ApplicationUrl]: ReturnType<typeof readApplicationUrlStrategy>;
	[UrlSearchParamStrategy.Primitive]: ReturnType<typeof readPrimitiveStrategy>;
};

/**
 * A mapping of strategy names to their corresponding implementation functions.
 */
const strategyByName = {
	[UrlSearchParamStrategy.ApplicationUrl]: readApplicationUrlStrategy,
	[UrlSearchParamStrategy.Primitive]: readPrimitiveStrategy
} satisfies Record<keyof StrategyReturnType, (...params: never[]) => unknown>;

/**
 * Reads a URL search parameter using the specified strategy.
 */
export function readUrlSearchParam<S extends keyof StrategyReturnType>(
	strategy: S,
	context: Readonly<UrlSearchParamReadContext>
): StrategyReturnType[S] {
	return strategyByName[strategy](context) as unknown as StrategyReturnType[S];
}

///
///
/// STRATEGIES
///
///

/*
 * Reads and processes an application URL from the search parameter.
 */
function readApplicationUrlStrategy(
	ctx: Readonly<UrlSearchParamReadContext>
): Result<Option<string>, UrlSearchParamDeserializationError> {
	const paramName = urlSearchParamDisplayNameByUrlSearchParamName[ctx.paramName];
	const value = ctx.url.searchParams.get(paramName);
	if (!value) return ok(undefined);

	const decoded = decodeURI(normalizeAbsoluteUrlPath(value));
	const prefix = SerializationPrefix.AppHref;
	if (!decoded.startsWith(prefix)) {
		return err(new UrlSearchParamDeserializationError(prefix, paramName, ''));
	}

	return ok(decoded.slice(prefix.length));
}

/**
 * Reads and deserializes a primitive value from the search parameter.
 */
function readPrimitiveStrategy(
	ctx: Readonly<UrlSearchParamReadContext>
): Result<Option<string | number | boolean>, UrlSearchParamDeserializationError> {
	const paramName = urlSearchParamDisplayNameByUrlSearchParamName[ctx.paramName];
	const value = ctx.url.searchParams.get(paramName);
	if (!value) return ok(undefined);

	const decoded = decodeURIComponent(normalizeAbsoluteUrlPath(value));
	const [prefix, ...rest] = decoded.split(sep);
	// TODO: use isNil. When it's empty string "", something went wrong and should be handled in switch/case
	if (!prefix) return ok(undefined);

	const decodedValue = rest.join('');

	switch (prefix) {
		case SerializationPrefix.String: {
			return ok(decodedValue);
		}

		case SerializationPrefix.Number: {
			const parsedFloat = Number.parseFloat(decodedValue);
			if (Number.isNaN(parsedFloat)) {
				return err(new UrlSearchParamDeserializationError(prefix, paramName, decodedValue));
			}

			return ok(parsedFloat);
		}

		case SerializationPrefix.Boolean: {
			switch (decodedValue) {
				case 'true': {
					return ok(true);
				}
				case 'false': {
					return ok(false);
				}
				default: {
					return err(new UrlSearchParamDeserializationError(prefix, paramName, decodedValue));
				}
			}
		}

		default: {
			return err(new UrlSearchParamDeserializationError(prefix, paramName, decodedValue));
		}
	}
}
