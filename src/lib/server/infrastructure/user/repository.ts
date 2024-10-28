import { eq, sql } from 'drizzle-orm';

import type {
	User,
	UserPasswordsDBSelectModel,
	UserDBSelectModel,
	UserHashedPassword,
	UserPlainTextPassword
} from '$lib/domain/user';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import {
	users,
	userPasswords,
	DatabaseReadError,
	DatabaseWriteError,
	type TX,
	database
} from '$lib/server/infrastructure/persistance';
import type { Option } from '$lib/types';

export class UserRepository {
	constructor(
		private hasher: PasswordHashingService,
		private db = database
	) {}

	async save(
		payload: { email: User['email']; password: UserPlainTextPassword },
		tx?: TX
	): Promise<UserDBSelectModel> {
		try {
			return await (tx ?? this.db).transaction(async (txx) => {
				const [result] = await txx
					.insert(users)
					.values({
						email: payload.email.trim()
					})
					.returning();
				if (!result) {
					throw new DatabaseWriteError('Updating did not return any value');
				}

				await txx.insert(userPasswords).values({
					hashedPassword: await this.hasher.hash(payload.password),
					userId: result.id
				});

				return result;
			});
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	// TODO: handle error. This select will throw when nothing is found
	async findUserPasswordById(
		payload: { userId: User['id'] },
		tx?: TX
	): Promise<Option<UserPasswordsDBSelectModel>> {
		try {
			const [credentials] = await (tx ?? this.db)
				.select()
				.from(userPasswords)
				.where(eq(userPasswords.userId, payload.userId))
				.limit(1);

			return credentials;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findByEmail(
		payload: { email: User['email'] },
		tx?: TX
	): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await (tx ?? this.db)
				.select()
				.from(users)
				.where(eq(users.email, payload.email))
				.limit(1);
			return user;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findById(payload: { userId: User['id'] }, tx?: TX): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await (tx ?? this.db)
				.select()
				.from(users)
				.where(eq(users.id, payload.userId))
				.limit(1);
			return user;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async getUserEmail(
		payload: { userId: User['id'] },
		tx?: TX
	): Promise<Option<{ email: string; isVerified: boolean }>> {
		try {
			const [data] = await (tx ?? this.db)
				.select({ email: users.email, isVerified: users.isEmailVerified })
				.from(users)
				.where(eq(users.id, payload.userId))
				.limit(1);
			return data;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async updatePassword(
		payload: { userId: User['id']; hashedPassword: UserHashedPassword },
		tx?: TX
	): Promise<void> {
		try {
			await (tx ?? this.db)
				.update(userPasswords)
				.set({ hashedPassword: payload.hashedPassword })
				.where(eq(userPasswords.userId, payload.userId));
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async setEmailAsVerified(payload: { userId: User['id'] }, tx?: TX): Promise<UserDBSelectModel> {
		try {
			const [result] = await (tx ?? this.db)
				.update(users)
				.set({ isEmailVerified: true })
				.where(eq(users.id, payload.userId))
				.returning();

			if (!result) throw new DatabaseWriteError('Updating did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async softDelete(payload: { userId: User['id'] }, tx?: TX): Promise<User['id']> {
		try {
			const [result] = await (tx ?? this.db)
				.update(users)
				.set({ deletedAt: sql`(current_timestamp)` })
				.where(eq(users.id, payload.userId))
				.returning({ id: users.id });

			if (!result) throw new DatabaseReadError('Deleting did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	// TODO: return error when not found
	async delete(payload: { userId: User['id'] }, tx?: TX): Promise<User['id']> {
		try {
			const [result] = await (tx ?? this.db)
				.delete(users)
				.where(eq(users.id, payload.userId))
				.returning({ id: users.id });

			if (!result) throw new DatabaseWriteError('Deleting did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
