import type { User } from '$lib/shared/domain/__core/user';
import type { Option } from '$lib/types';
import type { Session, User as LU } from 'lucia';

export function isValidUserSession(o: {
	user: Option<LU>;
	session: Option<Session>;
}): o is { user: User; session: Session } {
	return !!o.user && !!o.session;
}
