<script lang="ts">
	import { page } from '$app/state';
	import Tldraw from '$lib/Tldraw.svelte';
	import type { Editor } from '@tldraw/editor';

	// Persist only when a `?doc=` key is given (keeps non-persistence e2e tests from
	// sharing SQLite state). A real app would always pass a key.
	const persistenceKey = $derived(page.url.searchParams.get('doc') ?? undefined);

	// Expose the editor for e2e tests (mirrors tldraw's own test harness pattern).
	function oncreate(editor: Editor) {
		(window as unknown as { editor: Editor }).editor = editor;
	}
</script>

<svelte:head>
	<title>tldraw-svelte</title>
</svelte:head>

<div class="app">
	<Tldraw {oncreate} {persistenceKey} />
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
		overflow: hidden;
	}
	.app {
		position: fixed;
		inset: 0;
	}
</style>
