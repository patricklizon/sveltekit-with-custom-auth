import type { Enum } from '$lib/types';

// TODO: move to shared
export const UserRequestType = {
	ChangeEmail: 'user-request/ChangeEmail',
	ConfirmEmail: 'user-request/ConfirmEmail',
	ResetPassword: 'user-request/ResetPassword'
} as const;

export type UserRequestType = Enum<typeof UserRequestType>;
