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

	// Transform handles shown when exactly one shape is selected. Each carries a
	// `data-handle` id the select tool's Idle state reads (Canvas dispatches it as a
	// `target: 'selection'` pointer_down): corners + edges → resize, the four
	// *_rotate corner regions (just OUTSIDE each corner) → rotate. This mirrors
	// tldraw's desktop selection handles.
	const corners = [
		{ id: 'top_left', x: 0, y: 0, cursor: 'nwse-resize' },
		{ id: 'top_right', x: 1, y: 0, cursor: 'nesw-resize' },
		{ id: 'bottom_right', x: 1, y: 1, cursor: 'nwse-resize' },
		{ id: 'bottom_left', x: 0, y: 1, cursor: 'nesw-resize' }
	] as const;
	const edges = [
		{ id: 'top', x: 0.5, y: 0, cursor: 'ns-resize' },
		{ id: 'right', x: 1, y: 0.5, cursor: 'ew-resize' },
		{ id: 'bottom', x: 0.5, y: 1, cursor: 'ns-resize' },
		{ id: 'left', x: 0, y: 0.5, cursor: 'ew-resize' }
	] as const;
	// Rotate regions sit just outside each corner (translate pushes them outward).
	const rotateCorners = [
		{ id: 'top_left_rotate', x: 0, y: 0, tx: '-100%', ty: '-100%' },
		{ id: 'top_right_rotate', x: 1, y: 0, tx: '0%', ty: '-100%' },
		{ id: 'bottom_right_rotate', x: 1, y: 1, tx: '0%', ty: '0%' },
		{ id: 'bottom_left_rotate', x: 0, y: 1, tx: '-100%', ty: '0%' }
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
		{#each rotateCorners as r (r.id)}
			<div
				class="tl-rotate-handle"
				data-handle={r.id}
				data-handle-for={single.id}
				style:left="{r.x * single.w}px"
				style:top="{r.y * single.h}px"
				style:transform="translate({r.tx}, {r.ty})"
			></div>
		{/each}
		{#each edges as e (e.id)}
			<div
				class="tl-resize-handle tl-resize-handle--edge"
				data-handle={e.id}
				data-handle-for={single.id}
				style:left="{e.x * single.w}px"
				style:top="{e.y * single.h}px"
				style:cursor={e.cursor}
			></div>
		{/each}
		{#each corners as c (c.id)}
			<div
				class="tl-resize-handle"
				data-handle={c.id}
				data-handle-for={single.id}
				style:left="{c.x * single.w}px"
				style:top="{c.y * single.h}px"
				style:cursor={c.cursor}
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
		border: 1.5px solid var(--tl-color-selection-stroke, hsl(214, 84%, 56%));
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
		width: 9px;
		height: 9px;
		transform: translate(-50%, -50%);
		/* Handle fill = theme background (near-black in dark mode), not pure white;
		   stroke = themed selection-stroke (tldraw SelectionForegroundOverlayUtil). */
		background: var(--tl-color-background, #f9fafb);
		border: 1.5px solid var(--tl-color-selection-stroke, hsl(214, 84%, 56%));
		border-radius: 2px;
		pointer-events: all;
		cursor: nwse-resize;
		/* Above the rotate regions so the visible handle wins where they overlap. */
		z-index: 2;
	}
	/* Edge (1-D) resize handles — same look, sit between rotate and corner layers. */
	.tl-resize-handle--edge {
		z-index: 1;
	}
	/* Invisible rotate regions just outside each corner (tldraw desktop behaviour). */
	.tl-rotate-handle {
		position: absolute;
		width: 16px;
		height: 16px;
		background: transparent;
		pointer-events: all;
		cursor: grab;
		z-index: 0;
	}
	.tl-rotate-handle:active {
		cursor: grabbing;
	}
</style>
