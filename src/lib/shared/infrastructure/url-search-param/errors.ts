import { DomainError } from '$lib/errors';

export enum UrlSearchParamErrorType {
	Encoding = 'url-search-param-error/Encoding',
	Decoding = 'url-search-param-error/Decoding'
}

export class UrlSearchParamSerializationError extends DomainError<
	UrlSearchParamErrorType.Encoding,
	{ paramName: string }
> {
	constructor(message: string, paramName: string) {
		super(UrlSearchParamErrorType.Encoding, { paramName }, message);
	}
}

export class UrlSearchParamDeserializationError extends DomainError<
	UrlSearchParamErrorType.Decoding,
	{ paramName: string; decodedValue: unknown }
> {
	constructor(valueType: string, paramName: string, decodedValue: unknown) {
		super(
			UrlSearchParamErrorType.Decoding,
			{ paramName, decodedValue },
			`Failed decoding '${paramName}=${valueType}'`
		);
	}
}
