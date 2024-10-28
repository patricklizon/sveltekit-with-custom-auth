import { describe, expect, it } from 'vitest';

import { isEmpty, isNothing } from './utils';

describe(isNothing.name, () => {
	it.each([null, undefined])('returns true for Nothing values', (v) => {
		expect(isNothing(v)).to.equal(true);
	});

	it.each([-0, 0, '', false])('returns false for Falsy values', (v) => {
		expect(isNothing(v)).to.equal(false);
	});

	it.each([123, 'hello', true, 123n, Symbol('universe')])(
		'returns false for Primitive values',
		(v) => {
			expect(isNothing(v)).to.equal(false);
		}
	);

	it.each([{ id: 1 }, {}, [], Error])('returns false for Object values', (v) => {
		expect(isNothing(v)).to.equal(false);
	});
});

describe(isEmpty.name, () => {
	it.each(['', [], new Set([]), new Map([])])('returns true for empty values', (v) => {
		expect(isEmpty(v)).to.equal(true);
	});

	it.each([
		' ',
		['hello', 'universe'],
		new Set(['hello', 'universe']),
		new Map([['hello', 'universe']])
	])('returns false for non empty values', (v) => {
		expect(isEmpty(v)).to.equal(false);
	});
});
