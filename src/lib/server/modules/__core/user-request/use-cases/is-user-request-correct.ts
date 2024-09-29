import { err, ok, Result } from 'neverthrow';

import {
	UserRequestExpiredError,
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import { UnexpectedError } from '$lib/errors';
import type { UserRequestRepository } from '$lib/server/modules/__core/user-request';

type UseCaseInput = Readonly<{
	userId: UserRequest['userId'];
	userRequestId: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	UserRequestNonExistingError | UserRequestExpiredError | UnexpectedError
>;

export class IsUserRequestCorrectUseCase {
	constructor(private userRequestRepository: UserRequestRepository) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const userRequest = await this.userRequestRepository.findById(
				input.userId,
				input.userRequestId
			);
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
