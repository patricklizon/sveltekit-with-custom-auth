import { safeCastId } from '$lib/domain/id';
import type { TimeZone } from '$lib/domain/time';

export function readClientTimeZone(): TimeZone {
	const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

	return safeCastId(timeZone);
}
