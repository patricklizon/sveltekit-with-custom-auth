<script lang="ts">
	import { page } from '$app/stores';
</script>

<h1>{$page.status}: {$page.error.message}</h1>

{#if $page.status === 404}
	<p>Sorry, the user request you're looking for doesn't exist.</p>
{:else if $page.status === 403}
	<p>You don't have permission to access this user request.</p>
{:else if $page.status === 410}
	<p>This user request has expired. Please create a new request.</p>
{:else}
	<p>An unexpected error occurred. Please try again later.</p>
{/if}
