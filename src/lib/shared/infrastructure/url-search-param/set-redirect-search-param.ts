import { UrlSearchParamStrategy } from './config';
import { setUrlSearchParam } from './setter';
import { UrlSearchParamName } from './types';

export function setRedirectSearchParam(input: {
	url: URL;
	paramValue: string;
}): ReturnType<typeof setUrlSearchParam<typeof UrlSearchParamStrategy.ApplicationUrl>> {
	return setUrlSearchParam(
		UrlSearchParamStrategy.ApplicationUrl,
		{
			paramName: UrlSearchParamName.Redirect,
			url: input.url
		},
		input.paramValue
	);
}
