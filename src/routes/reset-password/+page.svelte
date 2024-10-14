<script lang="ts">
	import type { SubmitFunction } from './$types';

	import { enhance } from '$app/forms';
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: false });
		};
	};
</script>

<main>
	<h1>reset password</h1>

	<form method="POST" use:enhance={handleSubmit}>
		<label for="email">Email</label>
		<input type="email" id="email" name="email" required /><br />
		<button>Send</button>
	</form>

	<a href={resolveRoute(RawPath.Login, {})}>Sign in</a>
</main>
