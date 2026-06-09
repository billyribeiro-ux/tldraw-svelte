<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// From-scratch DebugPanel (port of tldraw's): a small readout shown along the
	// bottom only when debug mode is on (toggled from the main menu). Reports the
	// live shape count, current tool, and zoom — all read reactively from the editor.
	const editor = getEditor();

	const isDebug = fromComputed('debug mode', () => editor.getInstanceState().isDebugMode);
	const shapeCount = fromComputed('shape count', () => editor.getCurrentPageShapeIds().size);
	const selectedCount = fromComputed('selected count', () => editor.getSelectedShapeIds().length);
	const toolId = fromComputed('current tool', () => editor.getCurrentToolId());
	const zoom = fromComputed('zoom', () => Math.round(editor.getZoomLevel() * 100));
</script>

{#if isDebug.current}
	<div class="tlui-debug-panel" data-testid="debug-panel">
		<span>{shapeCount.current} shapes</span>
		<span>{selectedCount.current} selected</span>
		<span>{toolId.current}</span>
		<span>{zoom.current}%</span>
	</div>
{/if}

<style>
	.tlui-debug-panel {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: var(--tl-space-4, 12px);
		padding: 2px 10px;
		font-family: var(--tl-font-mono, monospace);
		font-size: 11px;
		color: var(--tl-color-text-3, #6b6b6b);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-2, 6px) var(--tl-radius-2, 6px) 0 0;
		box-shadow: var(--tl-shadow-2);
		pointer-events: all;
		white-space: nowrap;
	}
</style>
