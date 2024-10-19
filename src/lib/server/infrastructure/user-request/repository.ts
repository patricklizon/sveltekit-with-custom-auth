import { and, eq, ne } from 'drizzle-orm';

import type { UserPlainTextOTP } from '$lib/domain/user';
import type { UserRequest } from '$lib/domain/user-request';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import {
	database,
	DatabaseReadError,
	DatabaseWriteError,
	userRequests,
	type TX
} from '$lib/server/infrastructure/persistance';
import type { Option } from '$lib/types';

export class UserRequestRepository {
	constructor(
		private hasher: PasswordHashingService,
		private db = database
	) {}

	async save(
		payload: { otp: UserPlainTextOTP; type: UserRequest['type']; userId: UserRequest['userId'] },
		tx?: TX
	): Promise<UserRequest['id']> {
		try {
			const [result] = await (tx ?? this.db)
				.insert(userRequests)
				.values({
					// TODO: use library for calculation i.e. add(now, minutesToMs(...))
					expiresAt: new Date(Date.now() + 1000 * 60 * 10),
					hashedOTP: await this.hasher.hash(payload.otp),
					type: payload.type,
					userId: payload.userId
				})
				.returning({ id: userRequests.id });

			if (!result) throw new DatabaseReadError('Creating request did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async findById(
		payload: { userId: UserRequest['userId']; userRequestId: UserRequest['id'] },
		tx?: TX
	): Promise<Option<UserRequest>> {
		try {
			const [result] = await (tx ?? this.db)
				.select()
				.from(userRequests)
				.where(
					and(eq(userRequests.id, payload.userRequestId), eq(userRequests.userId, payload.userId))
				)
				.limit(1);

			return result;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findAllByUserId(
		payload: { userId: UserRequest['userId'] },
		tx?: TX
	): Promise<UserRequest['id'][]> {
		try {
			const result = await (tx ?? this.db)
				.select({ id: userRequests.id })
				.from(userRequests)
				.where(eq(userRequests.userId, payload.userId));

			return result.map((v) => v.id);
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async confirm(
		payload: { userId: UserRequest['userId']; userRequestId: UserRequest['id'] },
		tx?: TX
	): Promise<UserRequest> {
		try {
			const now = new Date(Date.now());
			const [result] = await (tx ?? this.db)
				.update(userRequests)
				.set({
					expiresAt: now,
					confirmedAt: now
				})
				.where(
					and(eq(userRequests.id, payload.userRequestId), eq(userRequests.userId, payload.userId))
				)
				.returning();

			if (!result) throw new DatabaseWriteError('Inserting did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllOfTypeByUserId(
		payload: { type: UserRequest['type']; userId: UserRequest['userId'] },
		tx?: TX
	): Promise<void> {
		try {
			await (tx ?? this.db)
				.delete(userRequests)
				.where(and(eq(userRequests.userId, payload.userId), eq(userRequests.type, payload.type)));
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllOfTypeButOneByUserId(
		payload: {
			type: UserRequest['type'];
			userRequestId: UserRequest['id'];
			userId: UserRequest['userId'];
		},
		tx?: TX
	): Promise<void> {
		try {
			await (tx ?? this.db)
				.delete(userRequests)
				.where(
					and(
						ne(userRequests.id, payload.userRequestId),
						eq(userRequests.userId, payload.userId),
						eq(userRequests.type, payload.type)
					)
				);
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
