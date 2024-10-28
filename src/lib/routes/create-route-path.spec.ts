import { expect, it, describe } from 'vitest';

import { createRoutePath } from './create-route-path';

import { ValidationError } from '$lib/errors';

describe('paths without parameters', () => {
	const rawRoute = '/users/posts/';

	it('handles empty parameter dictionary', () => {
		const left = createRoutePath(rawRoute, {});
		const right = '/users/posts';

		if (left.isErr()) {
			expect(true).to.equal(false);
			return;
		}

		expect(left.value).to.equal(right);
	});

	it('ignores extra parameters', () => {
		const left = createRoutePath(rawRoute, { id: 'test', userId: 1 });
		const right = '/users/posts';

		if (left.isErr()) {
			expect(true).to.equal(false);
			return;
		}

		expect(left.value).to.equal(right);
	});
});

describe('paths with single parameter', () => {
	const rawRoute = '/users/[user_id]/posts/';

	it('successfully replaces valid parameter', () => {
		const paramDict = { user_id: 'user-id' };
		const left = createRoutePath(rawRoute, paramDict);
		const right = `/users/${paramDict.user_id}/posts`;

		if (left.isErr()) {
			expect(true).to.equal(false);
			return;
		}

		expect(left.value).to.equal(right);
	});

	it('fails with validation error for missing parameter', () => {
		const paramDict = { postId: 'post-id', userId: 'user-id' };
		// @ts-expect-error: incorrect type
		const left = createRoutePath(rawRoute, paramDict);

		if (left.isOk()) {
			expect(true).to.equal(false);
			return;
		}

		expect(left.isErr()).to.equal(true);
		expect(left.error).to.be.an.instanceOf(ValidationError);
		expect(left.error.data).to.deep.equal({ user_id: undefined });
	});
});

describe('paths with multiple parameters', () => {
	const rawRoute = '/users/[userId]/posts/[postId]/[revisionId]';

	it('successfully replaces all parameters', () => {
		const paramDict = {
			postId: 'post-id',
			revisionId: 'revision-id',
			userId: 'user-id'
		};
		const left = createRoutePath(rawRoute, paramDict);
		const right = `/users/${paramDict.userId}/posts/${paramDict.postId}/${paramDict.revisionId}`;

		if (left.isErr()) {
			expect(true).to.deep.equal(false);
			return;
		}

		expect(left.value).to.equal(right);
	});

	it('fails with validation error for partial parameters', () => {
		const paramDict = {
			revisionId: undefined,
			userId: ''
		};
		// @ts-expect-error: incorrect type
		const left = createRoutePath(rawRoute, paramDict);

		if (left.isOk()) {
			expect(true).to.deep.equal(false);
			return;
		}

		expect(left.error).to.be.an.instanceOf(ValidationError);
		expect(left.error.data).to.deep.equal({
			userId: '',
			revisionId: undefined,
			postId: undefined
		});
	});

	it('handles extra parameters gracefully', () => {
		const paramDict = {
			postId: 'post-id',
			revisionId: 'revision-id',
			userId: 'user-id',
			randomId: 'random-id',
			unexpected_id: 'unexpected-id'
		};
		const left = createRoutePath(rawRoute, paramDict);
		const right = `/users/${paramDict.userId}/posts/${paramDict.postId}/${paramDict.revisionId}`;

		if (left.isErr()) {
			expect(true).to.deep.equal(false);
			return;
		}

		expect(left.value).to.equal(right);
	});

	it('properly encodes Unicode characters', () => {
		const rawPath = '/asdf/[emoji]/[national]';
		const paramDict = { emoji: '😵‍💫', national: 'óü' };
		const left = createRoutePath(rawPath, paramDict);

		if (left.isErr()) {
			expect(true).to.deep.equal(false);
			return;
		}

		expect(left.value).toMatchInlineSnapshot(
			`"/asdf/%F0%9F%98%B5%E2%80%8D%F0%9F%92%AB/%C3%B3%C3%BC"`
		);

		expect(decodeURI(left.value)).to.equal(`/asdf/${paramDict.emoji}/${paramDict.national}`);
	});
});
