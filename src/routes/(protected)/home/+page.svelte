<script>
	import { resolveRoute } from '$app/paths';
	import { RawPath } from '$lib/routes';
</script>

<h1>Home</h1>
<a href={resolveRoute(RawPath.Logout, {})}>Logout</a>
