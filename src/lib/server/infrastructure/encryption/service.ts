import { createCipheriv, createDecipheriv } from 'crypto';

import { DynamicBuffer } from '@oslojs/binary';
import { decodeBase64 } from '@oslojs/encoding';

import { ENCRYPTION_KEY } from '$env/static/private';

export class EncryptionService {
	private encryptionKey = decodeBase64(ENCRYPTION_KEY);

	private encrypt(data: Uint8Array): Uint8Array {
		const iv = new Uint8Array(16);
		crypto.getRandomValues(iv);
		const cipher = createCipheriv('aes-128-gcm', this.encryptionKey, iv);
		const encrypted = new DynamicBuffer(0);
		encrypted.write(iv);
		encrypted.write(cipher.update(data));
		encrypted.write(cipher.final());
		encrypted.write(cipher.getAuthTag());
		return encrypted.bytes();
	}

	encryptString(data: string): Uint8Array {
		return this.encrypt(new TextEncoder().encode(data));
	}

	// TODO: return result
	decrypt(encrypted: Uint8Array): Uint8Array {
		if (encrypted.byteLength < 33) {
			throw new Error('Invalid data');
		}
		const decipher = createDecipheriv('aes-128-gcm', this.encryptionKey, encrypted.slice(0, 16));
		decipher.setAuthTag(encrypted.slice(encrypted.byteLength - 16));
		const decrypted = new DynamicBuffer(0);
		decrypted.write(decipher.update(encrypted.slice(16, encrypted.byteLength - 16)));
		decrypted.write(decipher.final());
		return decrypted.bytes();
	}

	decryptToString(data: Uint8Array): string {
		return new TextDecoder().decode(this.decrypt(data));
	}
}
