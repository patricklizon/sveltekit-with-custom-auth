import type { Cookie, Session, User } from 'lucia';

import { lucia } from './lucia';

import { type Option } from '$lib/types';

export type RefreshSessionResult = { user: User; session: Session };

export interface Cookies {
	get(name: string, opts?: Record<string, unknown>): Option<string>;
	set(name: string, value: string, opts: Record<string, unknown> & { path: string }): void;
}

export class CookieSessionManager {
	private cookieName = lucia.sessionCookieName;

	async create(cookies: Cookies, id: User['id']): Promise<void> {
		const session = await lucia.createSession(id, {});
		const c = lucia.createSessionCookie(session.id);
		this.setCookie(cookies, c);
	}

	async refresh(cookies: Cookies): Promise<Option<RefreshSessionResult>> {
		const sessionId = cookies.get(this.cookieName);
		if (!sessionId) return;

		try {
			const { user, session } = await lucia.validateSession(sessionId);

			if (session?.fresh) {
				const c = lucia.createSessionCookie(session.id);
				this.setCookie(cookies, c);
			}

			if (!session) {
				const c = lucia.createBlankSessionCookie();
				this.setCookie(cookies, c);
			}

			return user ? { user, session } : undefined;
		} catch (error) {
			console.error('Session refresh error:', error);
			this.setCookie(cookies, lucia.createBlankSessionCookie());
			return null;
		}
	}

	async invalidate(cookies: Cookies): Promise<void> {
		const sessionId = cookies.get(this.cookieName);
		if (sessionId) await lucia.invalidateSession(sessionId);

		const c = lucia.createBlankSessionCookie();
		this.setCookie(cookies, c);
	}

	private setCookie(cookies: Cookies, c: Cookie): void {
		cookies.set(this.cookieName, c.value, {
			path: '.',
			...c.attributes
		});
	}
}
