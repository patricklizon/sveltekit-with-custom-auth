<script lang="ts">
	const { data, children } = $props();
</script>

<pre>userId {data.user?.id}</pre>
<pre>session {JSON.stringify(data.session, null, 2)}</pre>

{@render children()}

