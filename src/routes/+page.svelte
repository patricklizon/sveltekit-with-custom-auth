<script>
	import { resolveRoute } from '$app/paths';
	import { page } from '$app/stores';
	import { RawPath } from '$lib/routes';
</script>

<h1>Welcome to SvelteKit</h1>
<h2>language: {$page.data.acceptLanguage}</h2>
<p>
	Visit <a href={resolveRoute(RawPath.Login, {})}>login</a> or
	<a href={resolveRoute(RawPath.Register, {})}>register</a>
</p>
