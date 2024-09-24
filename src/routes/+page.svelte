<script>
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';
</script>

<h1>Welcome to SvelteKit</h1>
<p>
	Visit <a href={resolveRoute(RawPath.Login, {})}>login</a> or
	<a href={resolveRoute(RawPath.Register, {})}>register</a>
</p>
