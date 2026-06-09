<script lang="ts">
	import type { TLGeoShape } from '@tldraw/tlschema';
	import { getGeoShapePath, getDisplayValues, type GeoShapeUtil } from '@tldraw/tldraw';
	import { getPerfectDashProps } from '@tldraw/editor';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLGeoShape } = $props();

	const editor = getEditor();

	// Real display values from the real GeoShapeUtil options (strokeColor,
	// strokeWidth, fillColor, …) — exactly what the React GeoShapeBody read.
	const util = $derived(editor.getShapeUtil(shape) as GeoShapeUtil);
	const dv = $derived(getDisplayValues(util, shape) as {
		strokeColor: string;
		strokeWidth: number;
		fillColor: string;
	});

	const scale = $derived(shape.props.scale);
	const strokeWidth = $derived(dv.strokeWidth * scale);

	// The geometry path (covers all 20 geo variants).
	const path = $derived(getGeoShapePath(shape, dv.strokeWidth, util.options.customGeoTypes));

	// Fill path-data (hand-drawn when dash === 'draw', else plain).
	const fillD = $derived(
		shape.props.dash === 'draw'
			? path.toDrawD({ strokeWidth, randomSeed: shape.id, passes: 1, offset: 0, onlyFilled: true })
			: path.toD({ onlyFilled: true })
	);

	// Stroke rendering, mirroring PathBuilder.toSvg() by dash style:
	//  - 'draw'   → one hand-drawn path (toDrawD)
	//  - 'solid'  → one plain path (toD)
	//  - 'dashed'/'dotted' → per-command-run paths with stroke-dasharray
	type StrokeSeg = { d: string; dasharray?: string; dashoffset?: string };
	const strokeSegs = $derived.by((): StrokeSeg[] => {
		const dash = shape.props.dash;
		if (dash === 'draw') {
			return [{ d: path.toDrawD({ strokeWidth, randomSeed: shape.id, passes: 1, offset: 0 }) }];
		}
		if (dash === 'solid') {
			return [{ d: path.toD() }];
		}
		// dashed / dotted: split into runs between move commands and dash each.
		// PathBuilderGeometry gives us each segment's length; approximate by
		// dashing the whole path with perfect-dash props over its total length.
		const geom = path.toGeometry();
		const length = geom.length || 1;
		const { strokeDasharray, strokeDashoffset } = getPerfectDashProps(length, strokeWidth, {
			style: dash,
			snap: dash === 'dotted' ? 4 : 1,
			end: 'outset',
			start: 'outset'
		});
		return [{ d: path.toD(), dasharray: strokeDasharray, dashoffset: strokeDashoffset }];
	});

	const showFill = $derived(shape.props.fill !== 'none');
</script>

<svg class="tl-geo">
	{#if showFill}
		<path class="tl-geo__fill" d={fillD} fill={dv.fillColor} />
	{/if}
	{#each strokeSegs as seg, i (i)}
		<path
			class="tl-geo__stroke"
			d={seg.d}
			fill="none"
			stroke={dv.strokeColor}
			stroke-width={strokeWidth}
			stroke-dasharray={seg.dasharray}
			stroke-dashoffset={seg.dashoffset}
		/>
	{/each}
</svg>

<style>
	.tl-geo {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
	.tl-geo__stroke {
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
