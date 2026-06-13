<script lang="ts">
	import type { TLLineShape } from '@tldraw/tlschema';
	import { getDisplayValues, getPathForLineShape, type LineShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLLineShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's LineShapeSvg: build the PathBuilder via the real
	// getPathForLineShape (cubic/line spline), render per dash style. Display
	// values (strokeColor/strokeWidth) from the real LineShapeUtil options.
	const util = $derived(editor.getShapeUtil(shape) as LineShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as { strokeColor: string; strokeWidth: number }
	);
	const strokeWidth = $derived(dv.strokeWidth * shape.props.scale);
	const path = $derived(getPathForLineShape(shape));

	type Seg = { d: string; dasharray?: string; dashoffset?: string };
	const segs = $derived.by((): Seg[] => {
		const dash = shape.props.dash;
		if (dash === 'draw') {
			return [{ d: path.toDrawD({ strokeWidth, randomSeed: shape.id, passes: 1, offset: 0 }) }];
		}
		if (dash !== 'dashed' && dash !== 'dotted') {
			// 'solid' (and any non-dashed value) → one plain path.
			return [{ d: path.toD() }];
		}
		// dashed / dotted: one sub-path per segment, each dashed over its own length
		// with 'outset' joints — faithful to upstream PathBuilder.toDashedSvg (the line
		// renderer passes only { style, strokeWidth }). Each segment of a multi-point
		// line restarts the dash pattern at its vertex instead of dashing end-to-end.
		return path
			.toDashedSegments({ style: dash, strokeWidth })
			.map((s) => ({ d: s.d, dasharray: s.strokeDasharray, dashoffset: s.strokeDashoffset }));
	});
</script>

<svg class="tl-line">
	{#each segs as seg, i (i)}
		<path
			d={seg.d}
			fill="none"
			stroke={dv.strokeColor}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-dasharray={seg.dasharray}
			stroke-dashoffset={seg.dashoffset}
		/>
	{/each}
</svg>

<style>
	.tl-line {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
</style>
