<script lang="ts">
	import type { TLDrawShape } from '@tldraw/tlschema';
	import { last, rng } from '@tldraw/editor';
	import {
		getDisplayValues,
		getStrokePoints,
		getSvgPathFromStrokePoints,
		svgInk,
		getFreehandOptions,
		getDot,
		getPointsFromDrawSegments,
		getDrawShapeStrokeDashArray,
		type DrawShapeUtil
	} from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLDrawShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's DrawShapeSvg. Display values (strokeColor/Width/
	// fillColor) come from the real DrawShapeUtil options. Pattern fill falls back
	// to the solid fill color (PatternFill component not yet ported).
	const util = $derived(editor.getShapeUtil(shape) as DrawShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			strokeColor: string;
			strokeWidth: number;
			fillColor: string;
		}
	);

	const allPoints = $derived(
		getPointsFromDrawSegments(shape.props.segments, shape.props.scaleX, shape.props.scaleY)
	);
	const showAsComplete = $derived(
		shape.props.isComplete || last(shape.props.segments)?.type === 'straight'
	);

	// Reactive zoom (drives forceSolid + dot adjustment), via the live editor.
	const zoom = $derived(editor.getEfficientZoomLevel());

	const sw = $derived.by(() => {
		let s = (dv.strokeWidth + 1) * shape.props.scale;
		const forceSolid = zoom < 0.5 && zoom < 1.5 / s;
		if (
			!forceSolid &&
			!shape.props.isPen &&
			shape.props.dash === 'draw' &&
			allPoints.length === 1
		) {
			s += rng(shape.id)() * (s / 6);
		}
		return s;
	});
	const forceSolid = $derived(zoom < 0.5 && zoom < 1.5 / sw);
	const dotAdjustment = $derived(zoom < 0.2 ? 9 : 0.1);

	const options = $derived(getFreehandOptions(shape.props, sw, showAsComplete, forceSolid));

	// Branch 1: the "ink" look (dash === 'draw' and not forced solid).
	const isInk = $derived(!forceSolid && shape.props.dash === 'draw');
	const inkD = $derived(isInk ? svgInk(allPoints, options) : '');
	const inkFillD = $derived(
		isInk && shape.props.isClosed && shape.props.fill !== 'none' && allPoints.length > 1
			? getSvgPathFromStrokePoints(getStrokePoints(allPoints, options), shape.props.isClosed)
			: ''
	);

	// Branch 2: solid / dotted / dashed.
	const strokePoints = $derived(getStrokePoints(allPoints, options));
	const isDot = $derived(strokePoints.length < 2);
	const solidStrokePath = $derived(
		isDot
			? getDot(allPoints[0], 0)
			: getSvgPathFromStrokePoints(strokePoints, shape.props.isClosed)
	);
	const solidFill = $derived(isDot || shape.props.isClosed ? shape.props.fill : 'none');
	const dashArray = $derived(
		isDot ? 'none' : getDrawShapeStrokeDashArray(shape, sw, dotAdjustment)
	);
</script>

<svg class="tl-draw">
	{#if isInk}
		{#if inkFillD}
			<path d={inkFillD} fill={dv.fillColor} />
		{/if}
		<path d={inkD} stroke-linecap="round" fill={dv.strokeColor} />
	{:else}
		{#if !isDot && shape.props.isClosed && solidFill !== 'none'}
			<path d={solidStrokePath} fill={dv.fillColor} />
		{/if}
		{#if shape.props.dash !== 'none'}
			<path
				d={solidStrokePath}
				stroke-linecap="round"
				fill={isDot ? dv.strokeColor : 'none'}
				stroke={dv.strokeColor}
				stroke-width={sw}
				stroke-dasharray={dashArray}
				stroke-dashoffset="0"
			/>
		{/if}
	{/if}
</svg>

<style>
	.tl-draw {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
</style>
