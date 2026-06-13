<script lang="ts">
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// The drag-select (marquee) rectangle. The select tool's Brushing state writes
	// `instanceState.brush` (a page-space Box) while dragging on empty canvas; tldraw
	// renders it as a translucent rectangle. Lives inside the camera-transformed HTML
	// layer, so it pans/zooms with the page like the selection indicators.
	const editor = getEditor();
	const brush = fromComputed('brush', () => editor.getInstanceState().brush);
</script>

{#if brush.current}
	<div
		class="tl-brush"
		style:transform="translate({brush.current.x}px, {brush.current.y}px)"
		style:width="{brush.current.w}px"
		style:height="{brush.current.h}px"
	></div>
{/if}

<style>
	.tl-brush {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		background: var(--tl-color-brush-fill, hsl(0, 0%, 56%, 10.2%));
		border: 1px solid var(--tl-color-brush-stroke, hsl(0, 0%, 56%, 25.1%));
		pointer-events: none;
	}
</style>
