import type { Option } from '$lib/types';
import type {
	User,
	UserPasswordsDBSelectModel,
	UserDBSelectModel,
	UserHashedPassword,
	UserRegisterDTO,
	UserPlainTextPassword
} from '$lib/shared/domain/__core/user';
import {
	database,
	DatabaseReadError,
	DatabaseWriteError
} from '$lib/server/infrastructure/persistance';
import { users, userPasswords } from '$lib/server/infrastructure/persistance';
import { eq, sql } from 'drizzle-orm';
import type { PasswordHasher } from '$lib/server/infrastructure/__core/security';

export class UserRepository {
	constructor(
		private hasher: PasswordHasher,
		private db = database
	) {}

	// TODO: handle error. This select will throw when nothing nothing is found
	async findUserPasswordById(id: User['id']): Promise<Option<UserPasswordsDBSelectModel>> {
		try {
			const [credentials] = await this.db
				.select()
				.from(userPasswords)
				.where(eq(userPasswords.userId, id))
				.limit(1);

			return credentials;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findByEmail(email: User['email']): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
			return user;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async findUserById(id: User['id']): Promise<Option<UserDBSelectModel>> {
		try {
			const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
			return user;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async getUserEmail(id: User['id']): Promise<Option<{ email: string; isVerified: boolean }>> {
		try {
			const [data] = await this.db
				.select({ email: users.email, isVerified: users.emailVerified })
				.from(users)
				.where(eq(users.id, id))
				.limit(1);
			return data;
		} catch (error) {
			throw new DatabaseReadError(error);
		}
	}

	async updatePassword(id: User['id'], hashedPassword: UserHashedPassword): Promise<void> {
		try {
			await this.db
				.update(userPasswords)
				.set({ hashedPassword })
				.where(eq(userPasswords.userId, id));
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async save(user: UserRegisterDTO, password: UserPlainTextPassword): Promise<UserDBSelectModel> {
		try {
			return await this.db.transaction(async (trx) => {
				const [result] = await trx
					.insert(users)
					.values({
						email: user.email
					})
					.returning();
				if (!result) throw new DatabaseWriteError('Updating did not return any value');

				await trx.insert(userPasswords).values({
					hashedPassword: await this.hasher.hash(password),
					userId: result.id
				});

				return result;
			});
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async setEmailAsVerified(id: User['id']): Promise<UserDBSelectModel> {
		try {
			const [result] = await this.db
				.update(users)
				.set({ emailVerified: true })
				.where(eq(users.id, id))
				.returning();

			if (!result) throw new DatabaseWriteError('Updating did not return any value');

			return result;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	async softDelete(id: User['id']): Promise<User['id']> {
		try {
			const [result] = await this.db
				.update(users)
				.set({ deletedAt: sql`(current_timestamp)` })
				.where(eq(users.id, id))
				.returning({ id: users.id });

			if (!result) throw new DatabaseReadError('Deleting did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}

	// TODO: return error when not found
	async delete(id: User['id']): Promise<User['id']> {
		try {
			const [result] = await this.db
				.delete(users)
				.where(eq(users.id, id))
				.returning({ id: users.id });

			if (!result) throw new DatabaseWriteError('Deleting did not return any value');

			return result.id;
		} catch (error) {
			throw new DatabaseWriteError(error);
		}
	}
}
