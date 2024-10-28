export type Nothing = undefined | null;

export type Primitive = string | number | boolean | symbol | bigint | Nothing;

export type JsonSafePrimitive = string | number | boolean;

export type JsonSafeArray = (Nothing | JsonSafePrimitive | JsonSafeRecord)[];

export type JsonSafeRecord = Record<string | number, Nothing | JsonSafePrimitive | JsonSafeArray>;

export type JsonSafeData = Nothing | JsonSafePrimitive | JsonSafeArray | JsonSafeRecord;

export type URLSafePrimitive = string | number | boolean;

export type Option<Something> = Something | Nothing;

export type Enum<T extends Record<string, string>> = T[keyof T];

export type FormParseFail<T extends Record<string, unknown> = Record<string, unknown>> = {
	success: false;
	data: T;
	errorType: string;
	errorByFieldName: Partial<Record<keyof T, string[]>>;
};

export type FormFail<T extends Option<Record<string, unknown>> = Option<Record<string, unknown>>> =
	{
		success: false;
		data: T;
		errorType: string;
		errorMessage: string;
	};

export interface Cookies {
	get(name: string, opts?: Record<string, unknown>): Option<string>;
	set(name: string, value: string, opts: Record<string, unknown> & { path: string }): void;
}
