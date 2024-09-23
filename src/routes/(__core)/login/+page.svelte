<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { UserErrorType } from '$lib/shared/domain/__core/user';
	import type {  SubmitFunction } from './$types';

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: false });
		};
	};



</script>

<svelte:head>
	<title>Login</title>
</svelte:head>

<h1>Login</h1>

<form method="POST" use:enhance={handleSubmit}>
	<div>
		<label for="email">Email</label>
		<input id="email" name="email" type="email" required autocomplete="email" />

		{#if $page.form?.errorByFieldName?.email}
			<p class="error">{$page.form?.errorByFieldName?.email}</p>
		{/if}
	</div>

	<div>
		<label for="password">Password</label>
		<input id="password" name="password" type="password" required autocomplete="current-password" />
	</div>

	<button type="submit">Log In</button>
</form>

{#if $page.form?.errorType === UserErrorType.InvalidPassword || $page.form?.errorType === UserErrorType.NonExisting}
	<p class="error">{$page.form?.error}</p>
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
