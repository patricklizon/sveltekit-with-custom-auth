<script lang="ts">
	import type { ActionData, SubmitFunction } from './$types';

	import { enhance } from '$app/forms';
	import { RawPath } from '$lib/routes';
	import { resolveRoute } from '$app/paths';

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: false });
		};
	};

	export let form: ActionData;
</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<h1>Login</h1>

<a href={resolveRoute(RawPath.Register, {})}>register</a>

<form method="POST" use:enhance={handleSubmit}>
	<div>
		<label for="email">Email</label>
		<input id="email" name="email" type="email" required autocomplete="email" />

		{#if form?.errorByFieldName?.email}
			<p class="error">{form.errorByFieldName.email}</p>
		{/if}
	</div>

	<div>
		<label for="password">Password</label>
		<input id="password" name="password" type="password" required autocomplete="current-password" />

		{#if form?.errorByFieldName?.password}
			<p class="error">{form.errorByFieldName.password}</p>
		{/if}
	</div>

	<button type="submit">Log In</button>
</form>

{#if form?.errorMessage}
	<p class="error">{form.errorMessage}</p>
{/if}

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
