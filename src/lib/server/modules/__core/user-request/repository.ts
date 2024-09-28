import type { Option } from '$lib/types';
import {
	database,
	DatabaseReadError,
	DatabaseWriteError,
	userRequests
} from '$lib/server/infrastructure/persistance';
import { and, eq } from 'drizzle-orm';
import type { UserRequest, UserRequestSaveDTO } from '$lib/shared/domain/__core/user-request';

export class UserRequestRepository {
	constructor(private db = database) {}

	async save(data: Readonly<UserRequestSaveDTO>): Promise<UserRequest['id']> {
		try {
			const [result] = await this.db
				.insert(userRequests)
				.values(data)
				.returning({ id: userRequests.id });

			if (!result) throw new DatabaseReadError('Creating request did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async findById(id: UserRequest['id']): Promise<Option<UserRequest>> {
		try {
			const [result] = await this.db
				.select()
				.from(userRequests)
				.where(eq(userRequests.id, id))
				.limit(1);

			return result;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findAllByUserId(id: UserRequest['userId']): Promise<UserRequest[]> {
		try {
			const result = await this.db.select().from(userRequests).where(eq(userRequests.userId, id));

			return result;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async confirm(id: UserRequest['id']): Promise<UserRequest> {
		try {
			const now = Date.now();
			const [result] = await this.db
				.update(userRequests)
				.set({
					// TODO: use library for date formatting and calculation
					expiresAt: new Date(now + 1000 * 60 * 10),
					confirmedAt: new Date(now)
				})
				.where(eq(userRequests.id, id))
				.returning();

			if (!result) throw new DatabaseWriteError('Inserting did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllByUserId(type: UserRequest['type'], id: UserRequest['userId']): Promise<void> {
		try {
			await this.db
				.delete(userRequests)
				.where(and(eq(userRequests.userId, id), eq(userRequests.type, type)));
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
