import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia, TimeSpan } from 'lucia';

import { dev } from '$app/environment';
import { database, sessions, users } from '$lib/server/infrastructure/persistance';
import type { User } from '$lib/shared/domain/__core/user';

const adapter = new DrizzleSQLiteAdapter(database, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionExpiresIn: new TimeSpan(2, 'w'),
	sessionCookie: {
		attributes: { secure: !dev } // Use secure cookies in production
	},
	// Map User to DatabaseUserAttributes
	getUserAttributes: (attributes) => {
		return {
			email: attributes.email,
			id: attributes.id,
			emailVerified: attributes.emailVerified,
			twoFactorEnabled: attributes.twoFactorEnabled,
			twoFactorVerified: attributes.twoFactorVerified
		} satisfies User;
	}
});

// Extend Lucia's type definitions to be able to safely access authenticated user's data in the app
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: User;
	}
}
