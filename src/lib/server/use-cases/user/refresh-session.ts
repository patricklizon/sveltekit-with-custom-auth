import type { Session } from '$lib/domain/session';
import type { User } from '$lib/domain/user';
import type { SessionService } from '$lib/server/infrastructure/session';
import type { Cookies, Option } from '$lib/types';

type UseCaseInput = { cookies: Cookies };

type UseCaseResult = Option<{ session: Session; user: User }>;

export class RefreshSessionUseCase {
	constructor(private sessionService: SessionService) {}

	async execute({ cookies }: UseCaseInput): Promise<UseCaseResult> {
		const token = this.sessionService.getSessionToken(cookies);
		if (!token) return;

		const result = await this.sessionService.validate(token);
		if (!result) {
			this.sessionService.deleteSessionTokenCookie(cookies);
		} else {
			this.sessionService.setSessionTokenCookie(cookies, token, result.session.expiresAt);
		}

		return result;
	}
}
