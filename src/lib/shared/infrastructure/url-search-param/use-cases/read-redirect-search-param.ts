import { UrlSearchParamStrategy } from '../config';
import { readUrlSearchParam } from '../reader';
import { UrlSearchParamName } from '../types';

type UseCaseInput = URL;

export class ReadRedirectSearchParamUseCase {
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	execute(input: UseCaseInput) {
		return readUrlSearchParam(UrlSearchParamStrategy.ApplicationUrl, {
			paramName: UrlSearchParamName.Redirect,
			url: input
		});
	}
}
