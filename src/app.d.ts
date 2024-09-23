// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		/** available on server side */
		interface Locals {
			user: import('lucia').User | null | undefined;
			session: import('lucia').Session | null | undefined;
		}
		/** available on client side */
		interface PageData {
			user: import('lucia').User | null | undefined;
			session: import('lucia').Session | null | undefined;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
