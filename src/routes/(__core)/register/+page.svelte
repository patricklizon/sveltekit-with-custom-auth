<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';
	import type { SubmitFunction } from './$types';
	let isSubmitting = $state(false);

	const handleSubmit: SubmitFunction = () => {
		isSubmitting = true;

		return async ({ result, update }) => {
			if (result.type === 'failure') isSubmitting = false;
			await update();
		};
	};
</script>

<h1>register</h1>

<a href={resolveRoute(RawPath.Logout, {})}>logout</a>

<form method="POST" use:enhance={handleSubmit}>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" />

	<label for="password">Password</label>
	<input id="password" name="password" type="password" />

	<label for="passwordConfirmation">Password confirmation</label>
	<input id="passwordConfirmation" name="passwordConfirmation" type="password" />

	<button type="submit" disabled={isSubmitting}>
		{#if isSubmitting}
			Submitting...
		{:else}
			Register
		{/if}
	</button>
</form>
