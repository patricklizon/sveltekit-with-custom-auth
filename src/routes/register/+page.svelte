<script lang="ts">
	import type { ActionData, SubmitFunction } from './$types';

	import { enhance } from '$app/forms';
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';

	let { form } = $props<{ form?: ActionData }>();
	let isSubmitting = $state(false);

	const handleSubmit: SubmitFunction = () => {
		isSubmitting = true;

		return async ({ result, update }) => {
			if (result.type === 'failure') {
				isSubmitting = false;
			}

			await update({ reset: false });
		};
	};
</script>

<h1>register</h1>

<a href={resolveRoute(RawPath.Login, {})}>login</a>

{#if form?.errorMessage}
	<p>{form?.errorMessage}</p>
{/if}

<form method="POST" use:enhance={handleSubmit}>
	<label for="email">Email</label>
	<input id="email" name="email" type="email" />
	{#if form?.errorByFieldName?.email}
		<p class="error">{form.errorByFieldName.email}</p>
	{/if}

	<label for="password">Password</label>
	<input id="password" name="password" type="password" />
	{#if form?.errorByFieldName?.password}
		<p class="error">{form.errorByFieldName.password}</p>
	{/if}

	<label for="passwordConfirmation">Password confirmation</label>
	<input id="passwordConfirmation" name="passwordConfirmation" type="password" />
	{#if form?.errorByFieldName?.passwordConfirmation}
		<p class="error">{form.errorByFieldName.passwordConfirmation}</p>
	{/if}

	<button type="submit" disabled={isSubmitting}>
		{#if isSubmitting}
			Submitting...
		{:else}
			Register
		{/if}
	</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.error {
		color: red;
	}
</style>
