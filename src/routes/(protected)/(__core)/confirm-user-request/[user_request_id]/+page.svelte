<script lang="ts">
	import { type PageData, type SubmitFunction } from './$types';

	import { enhance } from '$app/forms';

	export let data: PageData;

	const handleSubmit: SubmitFunction = () => {
		return ({ update }) => {
			update({ reset: false });
		};
	};
</script>

<!-- TODO: title should be dynamic based on request type -->
<h1>confirm request</h1>

<form method="POST" use:enhance={handleSubmit}>
	<input type="text" name="otp" id="otp" />
	<input type="hidden" id="requestId" name="requestId" value={data.userRequestId} />
	<button type="submit">submit</button>
</form>
