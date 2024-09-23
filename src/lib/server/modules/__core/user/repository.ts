import type { Option } from '$lib/types';
import type {
	User,
	UserPasswordsDBSelectModel,
	UserDBSelectModel,
	UserUpdateDTO,
	UserHashedPassword
} from '$lib/shared/domain/__core/user';
import {
	database,
	DatabaseReadError,
	DatabaseWriteError
} from '$lib/server/infrastructure/persistance';
import { users, userPasswords } from '$lib/server/infrastructure/persistance';
import { eq, sql } from 'drizzle-orm';

export class UserRepository {
	constructor(private db = database) {}

	// TODO: handle error. This select will throw when nothing nothing is found
	async findUserPasswordById(id: User['id']): Promise<Option<UserPasswordsDBSelectModel>> {
		try {
			const [credentials] = await this.db
				.select()
				.from(userPasswords)
				.where(eq(userPasswords.userId, id))
				.limit(1);

			return credentials;
		} catch (error: unknown) {
			throw new DatabaseReadError(error);
		}
	}

	async findByEmail(email: User['email']): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
			return user;
		} catch (error: unknown) {
			throw new DatabaseReadError(error);
		}
	}

	async findById(id: User['id']): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
			return user;
		} catch (error: unknown) {
			throw new DatabaseReadError(error);
		}
	}

	async updatePassword(id: User['id'], hashedPassword: UserHashedPassword): Promise<void> {
		try {
			await this.db
				.update(userPasswords)
				.set({ hashedPassword })
				.where(eq(userPasswords.userId, id));
		} catch (error: unknown) {
			throw new DatabaseWriteError(error);
		}
	}

	async save(user: User, hashedPassword: UserHashedPassword): Promise<Option<UserDBSelectModel>> {
		try {
			return await this.db.transaction(async (trx) => {
				const [result] = await trx.insert(users).values(user).returning();

				await trx.insert(userPasswords).values({
					hashedPassword,
					userId: user.id
				});

				return result;
			});
		} catch (error: unknown) {
			throw new DatabaseWriteError(error);
		}
	}

	async update(
		id: User['id'],
		updateData: Partial<UserUpdateDTO>
	): Promise<Option<UserDBSelectModel>> {
		try {
			const [updatedUser] = await this.db
				.update(users)
				.set(updateData)
				.where(eq(users.id, id))
				.returning();

			return updatedUser;
		} catch (error: unknown) {
			throw new DatabaseWriteError(error);
		}
	}

	async softDelete(id: User['id']): Promise<Option<User['id']>> {
		try {
			const [result] = await this.db
				.update(users)
				.set({ deletedAt: sql`(current_timestamp)` })
				.where(eq(users.id, id))
				.returning({ id: users.id });

			return result?.id;
		} catch (error: unknown) {
			throw new DatabaseWriteError(error);
		}
	}

	// TODO: return error when not found
	async delete(id: User['id']): Promise<Option<User['id']>> {
		try {
			const [result] = await this.db
				.delete(users)
				.where(eq(users.id, id))
				.returning({ id: users.id });

			return result?.id;
		} catch (error: unknown) {
			throw new DatabaseWriteError(error);
		}
	}
}
