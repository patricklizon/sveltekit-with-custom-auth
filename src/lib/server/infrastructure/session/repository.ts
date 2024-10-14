import { eq } from 'drizzle-orm';

import type { Session } from '$lib/domain/session';
import {
	DatabaseReadError,
	DatabaseWriteError,
	sessions,
	type DB
} from '$lib/server/infrastructure/persistance';
import type { Option } from '$lib/types';

export class SessionRepository {
	constructor(private db: DB) {}

	async save(session: Session): Promise<Session> {
		try {
			return await this.db.transaction(async (tx) => {
				const [result] = await tx
					.insert(sessions)
					.values({
						expiresAt: session.expiresAt,
						id: session.id,
						isTwoFactorVerified: session.isTwoFactorVerified,
						userId: session.userId
					})
					.returning();
				if (!result) throw new DatabaseWriteError('Saving did not return any value');

				return result;
			});
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async updateExpiresAt(
		sessionId: Session['id'],
		expiresAt: Session['expiresAt']
	): Promise<Session> {
		try {
			const [result] = await this.db
				.update(sessions)
				.set({
					expiresAt
				})
				.where(eq(sessions.id, sessionId))
				.returning();

			if (!result) throw new DatabaseReadError(`Could not find session with id: ${sessionId}`);

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async findById(sessionId: Session['id']): Promise<Option<Session>> {
		try {
			return await this.db.transaction(async (tx) => {
				const [result] = await tx
					.select({
						id: sessions.id,
						userId: sessions.userId,
						expiresAt: sessions.expiresAt,
						isTwoFactorVerified: sessions.isTwoFactorVerified
					})
					.from(sessions)
					.where(eq(sessions.id, sessionId))
					.limit(1);

				return result;
			});
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findAllByUserId(userId: Session['userId']): Promise<Session[]> {
		try {
			return await this.db.transaction(async (tx) => {
				const result = await tx
					.select({
						id: sessions.id,
						userId: sessions.userId,
						expiresAt: sessions.expiresAt,
						isTwoFactorVerified: sessions.isTwoFactorVerified
					})
					.from(sessions)
					.where(eq(sessions.userId, userId));

				return result;
			});
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async delete(sessionId: Session['id']): Promise<Pick<Session, 'id' | 'userId'>> {
		try {
			const [result] = await this.db
				.delete(sessions)
				.where(eq(sessions.id, sessionId))
				.returning({ id: sessions.id, userId: sessions.userId });

			if (!result) throw new DatabaseWriteError('Deleting did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async deleteAllByUserId(userId: Session['userId']): Promise<Session['userId']> {
		try {
			const [result] = await this.db
				.delete(sessions)
				.where(eq(sessions.userId, userId))
				.returning({ userId: sessions.userId });

			if (!result) throw new DatabaseWriteError('Deleting did not return any value');

			return result.userId;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
