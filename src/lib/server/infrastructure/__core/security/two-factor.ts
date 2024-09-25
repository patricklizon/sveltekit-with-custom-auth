import { base32 } from 'oslo/encoding';

export class TwoFactor {
	generateOTP(): string {
		const bytes = new Uint8Array(5);
		crypto.getRandomValues(bytes);
		return base32.encode(bytes);
	}

	generateRecoveryCode(): string {
		const recoveryCodeBytes = new Uint8Array(10);
		crypto.getRandomValues(recoveryCodeBytes);
		return base32.encode(recoveryCodeBytes);
	}
}
