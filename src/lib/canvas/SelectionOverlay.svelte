<script lang="ts">
	import { Mat } from '@tldraw/editor';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	const editor = getEditor();

	// Reactive: for each selected shape, its page transform (as CSS) + bounds.
	// Lives inside the camera-transformed HTML layer, so it pans/zooms with shapes.
	const selections = fromComputed('selection indicators', () => {
		return editor.getSelectedShapeIds().flatMap((id) => {
			const shape = editor.getShape(id);
			if (!shape) return [];
			const bounds = editor.getShapeGeometry(shape).bounds;
			const transform = Mat.toCssString(editor.getShapePageTransform(id));
			return [{ id, transform, w: Math.max(bounds.width, 1), h: Math.max(bounds.height, 1) }];
		});
	});

	// Corner handles only when exactly one shape is selected (keeps Phase-1 resize
	// simple). Each handle carries a `data-handle` id the select tool reads.
	const corners = [
		{ id: 'top_left', x: 0, y: 0 },
		{ id: 'top_right', x: 1, y: 0 },
		{ id: 'bottom_right', x: 1, y: 1 },
		{ id: 'bottom_left', x: 0, y: 1 }
	] as const;

	const single = $derived(selections.current.length === 1 ? selections.current[0] : undefined);
</script>

{#each selections.current as sel (sel.id)}
	<div
		class="tl-selection-indicator"
		data-indicator-for={sel.id}
		style:transform={sel.transform}
		style:width="{sel.w}px"
		style:height="{sel.h}px"
	></div>
{/each}

{#if single}
	<div
		class="tl-handles"
		style:transform={single.transform}
		style:width="{single.w}px"
		style:height="{single.h}px"
	>
		{#each corners as c (c.id)}
			<div
				class="tl-resize-handle"
				data-handle={c.id}
				data-handle-for={single.id}
				style:left="{c.x * single.w}px"
				style:top="{c.y * single.h}px"
			></div>
		{/each}
	</div>
{/if}

<style>
	.tl-selection-indicator {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		border: 1.5px solid var(--tl-selection-color, #4465e9);
		pointer-events: none;
		box-sizing: border-box;
	}
	.tl-handles {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		pointer-events: none;
	}
	.tl-resize-handle {
		position: absolute;
		width: 10px;
		height: 10px;
		transform: translate(-50%, -50%);
		background: #ffffff;
		border: 1.5px solid var(--tl-selection-color, #4465e9);
		border-radius: 2px;
		pointer-events: all;
		cursor: nwse-resize;
	}
</style>
