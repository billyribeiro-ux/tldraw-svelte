<script lang="ts">
	import {
		getPointerInfo,
		toDomPrecision,
		modulate,
		normalizeWheel,
		isAccelKey,
		Vec,
		type TLSelectionHandle
	} from '@tldraw/editor';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import { quickReactor } from '$lib/state-svelte/reactor.svelte';
	import Shape from './Shape.svelte';
	import SelectionOverlay from './SelectionOverlay.svelte';
	import ScribbleOverlay from './ScribbleOverlay.svelte';

	const editor = getEditor();

	// Reactive list of shapes to render (camera-culled + z-sorted by the engine).
	const renderingShapes = fromComputed('rendering shapes', () => editor.getRenderingShapes());

	// Mirror of DefaultCanvas's `position layers` quick reactor: translate/scale the
	// HTML layer to match the camera, synchronously on every camera change.
	function positionLayer(node: HTMLElement) {
		return quickReactor('position layer', () => {
			const { x, y, z } = editor.getCamera();
			const offset =
				z >= 1 ? modulate(z, [1, 8], [0.125, 0.5], true) : modulate(z, [0.1, 1], [-2, 0.125], true);
			node.style.transform = `scale(${toDomPrecision(z)}) translate(${toDomPrecision(
				x + offset
			)}px,${toDomPrecision(y + offset)}px)`;
		});
	}

	function onpointerdown(e: PointerEvent) {
		if (editor.wasEventAlreadyHandled(e)) return;
		if (e.button !== 0 && e.button !== 1 && e.button !== 2 && e.button !== 5) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		// If a resize handle was pressed, dispatch a pointer_down with the REAL
		// `target: 'selection'` + `handle` info — exactly the event tldraw's
		// SelectTool.Idle expects. It then transitions Idle → pointing_resize_handle →
		// (on drag) resizing, using the genuine engine state machine. (The Svelte
		// overlay owns the DOM handles since the engine renders no DOM; we just feed
		// the right event in.) `data-handle` ids match tldraw's corner names.
		const handleEl = (e.target as HTMLElement)?.closest?.('[data-handle]') as HTMLElement | null;
		const handle = handleEl?.dataset.handle as TLSelectionHandle | undefined;
		if (handle) {
			editor.dispatch({
				type: 'pointer',
				target: 'selection',
				handle,
				name: 'pointer_down',
				...getPointerInfo(editor, e)
			});
		} else {
			editor.dispatch({
				type: 'pointer',
				target: 'canvas',
				name: 'pointer_down',
				...getPointerInfo(editor, e)
			});
		}
	}

	function onpointermove(e: PointerEvent) {
		if (editor.wasEventAlreadyHandled(e)) return;
		editor.dispatch({
			type: 'pointer',
			target: 'canvas',
			name: 'pointer_move',
			...getPointerInfo(editor, e)
		});
	}

	function onpointerup(e: PointerEvent) {
		if (editor.wasEventAlreadyHandled(e)) return;
		if (e.button !== 0 && e.button !== 1 && e.button !== 2 && e.button !== 5) return;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		editor.dispatch({
			type: 'pointer',
			target: 'canvas',
			name: 'pointer_up',
			...getPointerInfo(editor, e)
		});
	}

	// Trackpad / mouse-wheel pan & zoom — the engine's wheel handler does the math.
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		const delta = normalizeWheel(e);
		if (delta.x === 0 && delta.y === 0) return;
		editor.dispatch({
			type: 'wheel',
			name: 'wheel',
			delta,
			point: new Vec(e.clientX, e.clientY),
			shiftKey: e.shiftKey,
			altKey: e.altKey,
			ctrlKey: e.metaKey || e.ctrlKey,
			metaKey: e.metaKey,
			accelKey: isAccelKey(e)
		});
	}
</script>

<div
	class="tl-canvas"
	role="application"
	aria-label="Drawing canvas"
	tabindex="-1"
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	{onwheel}
>
	<div class="tl-html-layer" {@attach positionLayer}>
		{#each renderingShapes.current as r (r.id)}
			<Shape id={r.id} shape={r.shape} index={r.index} />
		{/each}
		<SelectionOverlay />
		<ScribbleOverlay />
	</div>
</div>

<style>
	.tl-canvas {
		position: absolute;
		inset: 0;
		overflow: hidden;
		touch-action: none;
		background: var(--tl-canvas-bg, #f9fafb);
		contain: strict;
	}
	.tl-html-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		transform-origin: top left;
	}
</style>
