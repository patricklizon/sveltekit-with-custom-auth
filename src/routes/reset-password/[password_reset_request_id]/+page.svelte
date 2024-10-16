<script lang="ts">
	import type { ActionData, PageData, SubmitFunction } from './$types';

	import { enhance } from '$app/forms';
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';

	export let data: PageData;
	export let form: ActionData;

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: true });
		};
	};
</script>

{#if form?.success}
	<p>now you are allowed to change password</p>
{:else}
	<h1>confirm email</h1>

	<form method="POST" use:enhance={handleSubmit}>
		<label for="email">Verification code</label>
		<input
			type="hidden"
			id="passwordResetRequestId"
			name="passwordResetRequestId"
			value={data.passwordResetRequestId}
		/>
		<input type="text" id="otp" name="otp" required /><br />
		<button>Confirm</button>
	</form>
{/if}

<a href={resolveRoute(RawPath.Login, {})}>Sign in</a>
