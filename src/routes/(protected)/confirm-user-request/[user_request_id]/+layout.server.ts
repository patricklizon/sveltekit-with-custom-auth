import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

import { safeCastId } from '$lib/domain/id';
import { UserRequestErrorType, type UserRequest } from '$lib/domain/user-request';
import { UnexpectedErrorType } from '$lib/errors';
import { PasswordHashingService } from '$lib/server/infrastructure/password-hashing';
import { UserRequestRepository } from '$lib/server/infrastructure/user-request';
import { IsUserRequestCorrectUseCase } from '$lib/server/use-cases/user-request';

const hasher = new PasswordHashingService();
const userRequestRepository = new UserRequestRepository(hasher);
const isUserRequestCorrectUseCase = new IsUserRequestCorrectUseCase(userRequestRepository);

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!locals.session || !locals.user) {
		return undefined;
	}

	const userRequestId: UserRequest['id'] = safeCastId(params.user_request_id);
	const userId = locals.user.id;

	const isRequestCorrectResult = await isUserRequestCorrectUseCase.execute({
		userId,
		userRequestId
	});

	if (isRequestCorrectResult.isErr()) {
		switch (isRequestCorrectResult.error.type) {
			case UserRequestErrorType.Expired: {
				throw error(410, {
					message: 'Request expired'
				});
			}
			case UserRequestErrorType.NonExisting: {
				throw error(404, {
					message: 'Request does not exists'
				});
			}
			case UnexpectedErrorType: {
				throw error(500, isRequestCorrectResult.error);
			}
		}
	}

	return {
		session: locals.session,
		user: locals.user,
		userRequestId
	};
};
