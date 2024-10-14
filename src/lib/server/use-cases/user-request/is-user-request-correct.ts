import { err, ok, Result } from 'neverthrow';

import {
	UserRequestExpiredError,
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/domain/user-request';
import { UnexpectedError } from '$lib/errors';
import type { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { database } from '$lib/server/infrastructure/persistance';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	UserRequestNonExistingError | UserRequestExpiredError | UnexpectedError
>;

/**
 * Use case to check if a user request is correct and valid.
 *
 * This use case verifies the existence and validity of a user request.
 * It checks if the request exists, hasn't been confirmed yet, and hasn't expired.
 */
export class IsUserRequestCorrectUseCase {
	constructor(
		private hasher: PasswordHashingService,
		private db = database
	) {}

	/*
	 * Executes the use case
	 */
	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const userRequestRepository = new UserRequestRepository(this.hasher, this.db);
			const userRequest = await userRequestRepository.findById(input.userId, input.userRequestId);
			if (!userRequest) {
				return err(new UserRequestNonExistingError(input.userRequestId));
			}

			const confirmedAt = userRequest.confirmedAt;
			if (confirmedAt) {
				return err(new UserRequestExpiredError(confirmedAt));
			}

			const isExpired = userRequest.expiresAt.getTime() <= Date.now();
			if (isExpired) {
				return err(new UserRequestExpiredError(userRequest.expiresAt));
			}

			return ok(userRequest);
		} catch (error) {
			return err(new UnexpectedError(error));
		}
	}
}
