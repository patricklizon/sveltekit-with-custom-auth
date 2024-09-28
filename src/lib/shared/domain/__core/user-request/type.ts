import type { userRequests } from '$lib/server/infrastructure/persistance';
import type { Id } from '$lib/shared/domain/__core/id';

export type UserRequestId = Id<'user-request-id'>;

export type UserRequestsDBSelectModel = typeof userRequests.$inferSelect;
export type UserRequestsDBInsertModel = typeof userRequests.$inferInsert;

export type UserRequest = Omit<UserRequestsDBSelectModel, 'createdAt'>;
export type UserRequestSaveDTO = Pick<
	UserRequestsDBInsertModel,
	'otp' | 'expiresAt' | 'userId' | 'type'
>;
