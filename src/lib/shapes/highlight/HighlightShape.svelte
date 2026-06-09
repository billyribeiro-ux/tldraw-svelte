<script lang="ts">
	import type { TLHighlightShape } from '@tldraw/tlschema';
	import {
		getDisplayValues,
		getHighlightStrokePoints,
		getShapeDot,
		getSvgPathFromStrokePoints,
		getPointsFromDrawSegments,
		type HighlightShapeUtil
	} from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLHighlightShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's HighlightRenderer: a single freehand stroke path
	// at the overlay opacity, using the real display values + freehand helpers.
	const util = $derived(editor.getShapeUtil(shape) as HighlightShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			strokeColor: string;
			strokeWidth: number;
			overlayOpacity: number;
		}
	);

	const zoom = $derived(editor.getEfficientZoomLevel());
	const sw = $derived(dv.strokeWidth * shape.props.scale);
	const forceSolid = $derived(sw / zoom < 1.5);

	const d = $derived.by(() => {
		const { strokePoints } = getHighlightStrokePoints(shape, sw, forceSolid);
		if (strokePoints.length > 1) return getSvgPathFromStrokePoints(strokePoints, false);
		const pts = getPointsFromDrawSegments(shape.props.segments, shape.props.scaleX, shape.props.scaleY);
		return getShapeDot(pts[0]);
	});
</script>

<svg class="tl-highlight">
	<path
		{d}
		fill="none"
		stroke-linecap="round"
		stroke={dv.strokeColor}
		stroke-width={sw}
		opacity={dv.overlayOpacity}
	/>
</svg>

<style>
	.tl-highlight {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
</style>
