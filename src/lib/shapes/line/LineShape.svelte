<script lang="ts">
	import type { TLLineShape } from '@tldraw/tlschema';
	import { getPerfectDashProps } from '@tldraw/editor';
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
		if (dash === 'solid') {
			return [{ d: path.toD() }];
		}
		const length = path.toGeometry().length || 1;
		const { strokeDasharray, strokeDashoffset } = getPerfectDashProps(length, strokeWidth, {
			style: dash,
			snap: dash === 'dotted' ? 4 : 1,
			start: 'outset',
			end: 'outset'
		});
		return [{ d: path.toD(), dasharray: strokeDasharray, dashoffset: strokeDashoffset }];
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
