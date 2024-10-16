// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		/** available on server side */
		interface Locals {
			acceptLanguage: import('$lib/domain/language').Language;
			user: import('$lib/domain/user').User | null | undefined;
			session: import('$lib/domain/session').Session | null | undefined;
		}
		/** available on client side */
		interface PageData {
			acceptLanguage: import('$lib/domain/language').Language;
			user: import('$lib/domain/user').User | null | undefined;
			session: import('$lib/domain/session').Session | null | undefined;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
