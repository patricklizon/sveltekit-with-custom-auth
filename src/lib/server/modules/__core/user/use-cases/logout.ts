import type { Cookies, CookieSessionManager } from '$lib/server/infrastructure/__core/security';

export class LogoutUseCase {
	constructor(private cookieSessionManager: CookieSessionManager) {}

	async execute(cookies: Cookies): Promise<void> {
		await this.cookieSessionManager.invalidate(cookies);
	}
}
