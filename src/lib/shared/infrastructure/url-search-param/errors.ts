import { BaseError } from '$lib/errors';
import type { JSONSafePrimitive, Option } from '$lib/types';

export enum UrlSearchParamErrorType {
	Encoding = 'url-search-param-error/Encoding',
	Decoding = 'url-search-param-error/Decoding'
}

type Ctx = Option<Record<string, JSONSafePrimitive | JSONSafePrimitive[]>>;

export class UrlSearchParamSerializationError extends BaseError<
	UrlSearchParamErrorType.Encoding,
	{ paramName: string; context?: Ctx }
> {
	constructor(message: string, paramName: string, context?: Ctx) {
		super(UrlSearchParamErrorType.Encoding, message, { paramName, context });
	}
}

export class UrlSearchParamDeserializationError extends BaseError<
	UrlSearchParamErrorType.Decoding,
	{ paramName: string; context?: Ctx }
> {
	constructor(paramName: string, context?: Ctx) {
		super(UrlSearchParamErrorType.Decoding, `Failed decoding '${paramName}'`, {
			paramName,
			context
		});
	}
}
