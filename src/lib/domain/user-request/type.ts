import type { Id } from '$lib/domain/id';
import type { userRequests } from '$lib/server/infrastructure/persistance';
import type { Enum } from '$lib/types';

export type UserRequestId = Id<'user-request-id'>;

export type UserRequestsDBSelectModel = typeof userRequests.$inferSelect;
export type UserRequestsDBInsertModel = typeof userRequests.$inferInsert;

export type UserRequest = Omit<UserRequestsDBSelectModel, 'createdAt'>;

export const UserRequestType = {
	ChangeEmail: 'user-request-type/ChangeEmail',
	ConfirmUserEmail: 'user-request-type/ConfirmUserEmail',
	ResetPassword: 'user-request-type/ResetPassword'
} as const;

export type UserRequestType = Enum<typeof UserRequestType>;
