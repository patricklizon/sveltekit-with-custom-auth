export type Nothing = undefined | null;

export type Option<Something> = Something | Nothing;

export type Primitive = string | number | boolean | symbol | bigint | Nothing;

export type JSONSafePrimitive = string | number | boolean;

export type JSONSafeArray = (Nothing | JSONSafePrimitive | JSONSafeRecord)[];

export type JSONSafeRecord = Record<string | number, Nothing | JSONSafePrimitive | JSONSafeArray>;

export type JSONSafeData = Nothing | JSONSafePrimitive | JSONSafeArray | JSONSafeRecord;

export type URLSafePrimitive = string | number | boolean;

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
