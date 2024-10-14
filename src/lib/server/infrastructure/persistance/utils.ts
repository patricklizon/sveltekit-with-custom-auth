import type { TX } from '.';

export function sqlCurrentTimeStamp(): Date {
	return new Date();
}

export function sqlDefaultCreatedAt(): Date {
	return sqlCurrentTimeStamp();
}

export function sqlDefaultUpdatedAt(): Date {
	return sqlCurrentTimeStamp();
}

/**
 * Safely attempts to rollback the transaction.
 * Suppresses the specific error thrown by Drizzle's tx.rollback,
 * which is used to abort the transaction.
 * This aligns with the codebase's approach of treating errors as values.
 *
 * Example usage:
 * ```typescript
 * import { safeTxRollback } from './utils';
 *
 * db.transaction(async (tx) => {
 *   try {
 *     // ... perform database operations
 *   } catch (error) {
 *     safeTxRollback(tx);
 *     return err(new DatabaseError(error));
 *   }
 * });
 * ```
 */
export function safeTxRollback(tx: TX): void {
	try {
		tx.rollback();
	} catch {
		// rollback throws error to break out of transaction
		// therefore nothing is needed here
	}
}
