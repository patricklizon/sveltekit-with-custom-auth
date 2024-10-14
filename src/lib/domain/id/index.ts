import { uuidv7 } from 'uuidv7';

/**
 * Represents a typed identifier.
 *
 * Using this type enhances type safety by preventing accidental mixing of
 * different ID types, even if they share the same underlying type.
 * This can help catch errors at compile-time rather than runtime.
 *
 * @param TBrand The base type of the identifier, used as a branded type.
 * @param TType The underlying type of the identifier, defaults to string.
 *
 * @example
 * ```typescript
 * // IDs
 * type UserId = Id<'user'>;
 * type ProductId = Id<'product', number>;
 *
 * // Non-ID types that need distinction from primitives
 * type EmailAddress = Id<'email-address'>;
 * type Percentage = Id<'percentage', number>;
 * ```
 */
export type Id<TBrand extends string, TType extends string | number = string> = TType & {
	readonly __opaque__: TBrand;
};

/**
 * Safely casts a string or number to a specific Id type.
 * This function should be used with caution as it performs an unchecked type assertion.
 */
export function safeCastId<T extends Id<string, K>, K extends string | number>(s: K): T {
	return s as unknown as T;
}

export function createId<T extends Id<string>>(): T {
	return uuidv7() as T;
}
