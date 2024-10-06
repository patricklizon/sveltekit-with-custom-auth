import { base32 } from 'oslo/encoding';

import { safeCastId } from '$lib/shared/domain/__core/id';
import type { UserPlainTextOTP, UserRecoveryCode } from '$lib/shared/domain/__core/user';

export class TwoFactor {
	generateOTP(): UserPlainTextOTP {
		return safeCastId(TwoFactor.generateCode(5));
	}

	generateRecoveryCodes(): UserRecoveryCode[] {
		return Array.from({ length: 4 }, () => safeCastId(TwoFactor.generateCode(10)));
	}

	private static generateCode(arraySize: number): string {
		// 1. Uint8Array(5) creates an array of 5 bytes.
		// 2. Each byte is 8 bits, so 5 bytes = 40 bits of data.
		// 3. Base32 encoding uses 5 bits to represent each character (2^5 = 32 possible characters).
		// 4. To encode 40 bits of data in 5-bit chunks
		// 5. 40 bits / 5 bits per character = 8 characters
		const bytes = new Uint8Array(arraySize);
		crypto.getRandomValues(bytes);
		return safeCastId(base32.encode(bytes));
	}
}
