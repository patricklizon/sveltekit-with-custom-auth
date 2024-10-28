import { err, ok, type Result } from 'neverthrow';

import {
	urlSearchParamDisplayNameByUrlSearchParamName,
	UrlSearchParamStrategy,
	SerializationPrefix,
	sep
} from './config';
import { UrlSearchParamDeserializationError } from './errors';
import { urlSearchParamMaxLengthByName, type UrlSearchParamName } from './types';
import { mapStringToAbsoluteUrlPath } from './utils';

import type { Option, URLSafePrimitive } from '$lib/types';
import { isNothing } from '$lib/utils';

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
 * Workaround used to correctly typed `readUrlSearchParam`.
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

	const decoded = decodeURIComponent(mapStringToAbsoluteUrlPath(value));
	const prefix = SerializationPrefix.AppRoute;

	if (!decoded.startsWith(prefix)) {
		return err(new UrlSearchParamDeserializationError(paramName, { prefix }));
	}

	return ok(decoded.slice(prefix.length));
}

/**
 * Reads and deserializes a primitive value from the search parameter.
 */
function readPrimitiveStrategy(
	ctx: Readonly<UrlSearchParamReadContext>
): Result<Option<URLSafePrimitive>, UrlSearchParamDeserializationError> {
	const paramName = urlSearchParamDisplayNameByUrlSearchParamName[ctx.paramName];
	const value = ctx.url.searchParams.get(paramName);
	if (!value) return ok(undefined);

	const isLongerThanAllowed = value.length > urlSearchParamMaxLengthByName[ctx.paramName];
	if (isLongerThanAllowed) {
		return err(new UrlSearchParamDeserializationError(paramName, { isLongerThanAllowed }));
	}

	const decoded = decodeURIComponent(mapStringToAbsoluteUrlPath(value));
	const [prefix, ...rest] = decoded.split(sep);
	if (isNothing(prefix)) return ok(undefined);

	const decodedValue = rest.join('');

	switch (prefix) {
		case SerializationPrefix.String: {
			return ok(decodedValue);
		}

		case SerializationPrefix.Number: {
			const parsedFloat = Number.parseFloat(decodedValue);
			const isNotANumber = Number.isNaN(parsedFloat);
			const isNotFinite = !Number.isFinite(parsedFloat);
			const isOutOfSafeRange =
				Number.MIN_SAFE_INTEGER > parsedFloat || parsedFloat > Number.MAX_SAFE_INTEGER;

			if (isNotANumber || isNotFinite || isOutOfSafeRange) {
				return err(
					new UrlSearchParamDeserializationError(paramName, {
						prefix,
						isNotANumber,
						isNotFinite,
						isOutOfSafeRange
					})
				);
			}

			return ok(parsedFloat);
		}

		case SerializationPrefix.Boolean: {
			const maybeBoolean = decodedValue.toLowerCase();
			const truthy = new Set(['true', 'yes', 'ok', '1']);
			const falsy = new Set(['false', 'no', '0']);

			switch (true) {
				case truthy.has(maybeBoolean): {
					return ok(true);
				}
				case falsy.has(maybeBoolean): {
					return ok(false);
				}
				default: {
					return err(
						new UrlSearchParamDeserializationError(paramName, {
							prefix,
							validValues: [...truthy, ...falsy]
						})
					);
				}
			}
		}

		default: {
			return err(new UrlSearchParamDeserializationError(paramName, { prefix }));
		}
	}
}
