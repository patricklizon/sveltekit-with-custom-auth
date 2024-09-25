<script lang="ts">
	import type { SubmitFunction } from './$types';

	import { enhance } from '$app/forms';

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: true });
		};
	};
</script>

<h1>reset password</h1>

<form method="POST" use:enhance={handleSubmit}>
	<!-- TODO: -->
	<!-- <input id="email" name="email" value={session.email} hidden required /><br /> -->
	<label for="password">Password</label>
	<input type="password" id="password" name="password" autocomplete="new-password" required /><br />
	<label for="passwordConfirm">Confirm Password</label>
	<input
		type="password"
		id="passwordConfirm"
		name="passwordConfirm"
		autocomplete="new-password"
		required
	/><br />
	<button>Reset password</button>
</form>
