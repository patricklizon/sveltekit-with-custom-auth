import { and, eq, ne } from 'drizzle-orm';

import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';
import {
	DatabaseReadError,
	DatabaseWriteError,
	userRequests,
	type DB
} from '$lib/server/infrastructure/persistance';
import type { UserRequest, UserRequestSaveDTO } from '$lib/shared/domain/__core/user-request';
import type { Option } from '$lib/types';

export class UserRequestRepository {
	constructor(
		private hasher: PasswordHasher,
		private db: DB
	) {}

	async save({ otp, type, userId }: Readonly<UserRequestSaveDTO>): Promise<UserRequest['id']> {
		try {
			const [result] = await this.db
				.insert(userRequests)
				.values({
					// TODO: use libary for calculation i.e. add(now, minutesToMs(...))
					expiresAt: new Date(Date.now() + 1000 * 60 * 10),
					hashedOTP: await this.hasher.hash(otp),
					type,
					userId
				})
				.returning({ id: userRequests.id });

			if (!result) throw new DatabaseReadError('Creating request did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async findById(
		userId: UserRequest['userId'],
		requestId: UserRequest['id']
	): Promise<Option<UserRequest>> {
		try {
			const [result] = await this.db
				.select()
				.from(userRequests)
				.where(and(eq(userRequests.id, requestId), eq(userRequests.userId, userId)))
				.limit(1);

			return result;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findAllByUserId(userId: UserRequest['userId']): Promise<UserRequest['id'][]> {
		try {
			const result = await this.db
				.select({ id: userRequests.id })
				.from(userRequests)
				.where(eq(userRequests.userId, userId));

			return result.map((v) => v.id);
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async confirm(userId: UserRequest['userId'], requestId: UserRequest['id']): Promise<UserRequest> {
		try {
			const now = new Date(Date.now());
			const [result] = await this.db
				.update(userRequests)
				.set({
					expiresAt: now,
					confirmedAt: now
				})
				.where(and(eq(userRequests.id, requestId), eq(userRequests.userId, userId)))
				.returning();

			if (!result) throw new DatabaseWriteError('Inserting did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllOfTypeByUserId(
		type: UserRequest['type'],
		id: UserRequest['userId']
	): Promise<void> {
		try {
			await this.db
				.delete(userRequests)
				.where(and(eq(userRequests.userId, id), eq(userRequests.type, type)));
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllOfTypeButOneByUserId(
		type: UserRequest['type'],
		requestId: UserRequest['id'],
		id: UserRequest['userId']
	): Promise<void> {
		try {
			await this.db
				.delete(userRequests)
				.where(
					and(
						ne(userRequests.id, requestId),
						eq(userRequests.userId, id),
						eq(userRequests.type, type)
					)
				);
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
