import type { Cookies, SessionService } from '$lib/server/infrastructure/session';

export class LogoutUseCase {
	constructor(private sessionService: SessionService) {}

	async execute(cookies: Cookies): Promise<void> {
		this.sessionService.deleteSessionTokenCookie(cookies);
	}
}
