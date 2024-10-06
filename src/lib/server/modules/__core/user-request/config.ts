import type { Enum } from '$lib/types';

// TODO: move to shared
export const UserRequestType = {
	ChangeEmail: 'user-request/ChangeEmail',
	ConfirmUserEmail: 'user-request/ConfirmUserEmail',
	ResetPassword: 'user-request/ResetPassword'
} as const;

export type UserRequestType = Enum<typeof UserRequestType>;
