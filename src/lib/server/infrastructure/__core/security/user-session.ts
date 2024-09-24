import type { Option } from '$lib/types';
import type { Session, User } from 'lucia';

export function isValidUserSession(o: {
	user: Option<User>;
	session: Option<Session>;
}): o is { user: User; session: Session } {
	return !!o.user && !!o.session;
}
