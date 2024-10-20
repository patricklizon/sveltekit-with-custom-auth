import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';

import type { UserRepository } from '../user';

import type { SessionRepository } from './repository';

import { safeCastId } from '$lib/domain/id';
import type { Session, SessionId, SessionToken } from '$lib/domain/session';
import type { User } from '$lib/domain/user';
import type { Cookies, Option } from '$lib/types';

export type RefreshSessionResult = { user: User; session: Session };

type SessionFlags = {
	isTwoFactorVerified: boolean;
};

export class SessionService {
	private readonly sessionTokenCookieName = 'token';
	private readonly sessionDuration = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

	constructor(
		private sessionRepository: SessionRepository,
		private userRepository: UserRepository
	) {}

	// TODO: refactor
	async validate(token: SessionToken): Promise<Option<{ user: User; session: Session }>> {
		const sessionId = this.mapSessionTokenToSessionId(token);
		const session = await this.sessionRepository.findById(sessionId);
		if (!session) return;
		console.log(session);
		const user = await this.userRepository.findById({ userId: session.userId });
		if (!user) return;

		// TODO: enable and update through repository method
		// if (user.isPasskeyEnabled || user.isSecurityKeyEnabled || user.isTTOPEnabled) {
		// user.registered2FA = true;
		// }

		if (Date.now() >= session.expiresAt.getTime()) {
			await this.invalidate(sessionId);
			// db.execute('DELETE FROM session WHERE id = ?', [sessionId]);
			return;
		}
		if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
			session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		}
		return { session, user };
	}

	async create(
		userId: User['id'],
		flags: SessionFlags
	): Promise<{ session: Session; token: SessionToken }> {
		const token = this.createSessionToken();
		const sessionId = this.mapSessionTokenToSessionId(token);
		const session = await this.sessionRepository.save({
			userId,
			isTwoFactorVerified: flags.isTwoFactorVerified,
			expiresAt: new Date(Date.now() + this.sessionDuration),
			id: sessionId
		});

		return { session, token };
	}

	async invalidate(sessionId: Session['id']): Promise<void> {
		await this.sessionRepository.delete(sessionId);
	}

	async invalidateAllByUserId(userId: Session['userId']): Promise<void> {
		await this.sessionRepository.deleteAllByUserId(userId);
	}

	setSessionTokenCookie(cookies: Cookies, token: string, expiresAt: Date): void {
		cookies.set(this.sessionTokenCookieName, token, {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			expires: expiresAt
		});
	}

	deleteSessionTokenCookie(cookies: Cookies): void {
		cookies.set(this.sessionTokenCookieName, '', {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			maxAge: 0
		});
	}

	getSessionToken(cookies: Cookies): Option<SessionToken> {
		const cookie = cookies.get(this.sessionTokenCookieName);
		if (!cookie) return;
		return safeCastId<SessionToken, string>(cookie);
	}

	private createSessionToken(): SessionToken {
		const tokenBytes = new Uint8Array(20);
		crypto.getRandomValues(tokenBytes);
		const encoded = encodeBase32LowerCaseNoPadding(tokenBytes);
		return safeCastId(encoded);
	}

	private mapSessionTokenToSessionId(token: SessionToken): SessionId {
		const encodedToken = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
		return safeCastId(encodedToken);
	}
}
