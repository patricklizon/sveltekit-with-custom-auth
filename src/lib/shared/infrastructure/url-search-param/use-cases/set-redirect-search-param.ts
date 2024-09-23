import { UrlSearchParamStrategy } from '../config';
import { setUrlSearchParam } from '../setter';
import { UrlSearchParamName } from '../types';

type UseCaseCtx = {
	baseURL: URL;
};

// TODO: create typed application path Id type
// for example: /login /home/nested/test
type UseCaseInput = string;

export class SetRedirectSearchParamUseCase {
	execute(ctx: UseCaseCtx, input: UseCaseInput): ReturnType<typeof setUrlSearchParam> {
		return setUrlSearchParam(
			UrlSearchParamStrategy.ApplicationUrl,
			{
				paramName: UrlSearchParamName.Redirect,
				baseURL: ctx.baseURL
			},
			input
		);
	}
}
