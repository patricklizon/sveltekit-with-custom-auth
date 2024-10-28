import type { SessionService } from '$lib/server/infrastructure/session';
import type { Cookies } from '$lib/types';

export class LogoutUseCase {
	constructor(private sessionService: SessionService) {}

	async execute(cookies: Cookies): Promise<void> {
		this.sessionService.deleteSessionTokenCookie(cookies);
	}
}
