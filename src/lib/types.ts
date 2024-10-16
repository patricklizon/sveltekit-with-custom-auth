export type Nothing = undefined | null;

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
