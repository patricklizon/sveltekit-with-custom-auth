import { UrlSearchParamStrategy } from '../config';
import { setUrlSearchParam } from '../setter';
import { UrlSearchParamName } from '../types';

// TODO: create typed application path Id type
// for example: /login /home/nested/test
type UseCaseInput = {
	url: URL;
	paramValue: string;
};

export class SetRedirectSearchParamUseCase {
	execute(
		input: UseCaseInput
	): ReturnType<typeof setUrlSearchParam<typeof UrlSearchParamStrategy.ApplicationUrl>> {
		return setUrlSearchParam(
			UrlSearchParamStrategy.ApplicationUrl,
			{
				paramName: UrlSearchParamName.Redirect,
				url: input.url
			},
			input.paramValue
		);
	}
}
