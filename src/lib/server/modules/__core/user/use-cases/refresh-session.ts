import { type Cookies, CookieSessionManager } from '$lib/server/infrastructure/__core/security';

type UseCaseInput = Cookies;

type UseCaseResult = ReturnType<InstanceType<typeof CookieSessionManager>['refresh']>;

export class RefreshSessionUseCase {
	constructor(private sessionCookieManager: CookieSessionManager) {}

	async execute(cookies: UseCaseInput): Promise<UseCaseResult> {
		return this.sessionCookieManager.refresh(cookies);
	}
}
