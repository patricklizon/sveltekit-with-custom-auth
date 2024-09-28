import { err, ok, Result } from 'neverthrow';

import {
	UserRequestExpiredError,
	UserRequestNonExistingError,
	type UserRequest
} from '$lib/shared/domain/__core/user-request';
import { UnexpectedError } from '$lib/errors';
import type { UserRequestRepository } from '$lib/server/modules/__core/user-request';

type UseCaseInput = Readonly<{
	id: UserRequest['id'];
}>;

type UseCaseResult = Result<
	UserRequest,
	UserRequestNonExistingError | UserRequestExpiredError | UnexpectedError
>;

export class ValidateUserRequestUseCase {
	constructor(private userRequestRepository: UserRequestRepository) {}

	async execute(input: UseCaseInput): Promise<UseCaseResult> {
		try {
			const userRequest = await this.userRequestRepository.findById(input.id);
			if (!userRequest) {
				return err(new UserRequestNonExistingError(input.id));
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
