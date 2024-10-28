import { describe, expect, test } from 'vitest';

import { mapStringToAbsoluteUrlPath } from './utils';

describe(mapStringToAbsoluteUrlPath.name, () => {
	test('handles correctly defined paths', () => {
		const left = mapStringToAbsoluteUrlPath('/hello/universe/');
		const right = '/hello/universe';

		expect(left).to.equal(right);
	});

	test('handles paths with invalid segments', () => {
		const left = mapStringToAbsoluteUrlPath('///./..///../hello/../universe/');
		const right = '/universe';

		expect(left).to.equal(right);
	});
});
