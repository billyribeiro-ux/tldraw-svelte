<script lang="ts">
	import type { TLGeoShape } from '@tldraw/tlschema';
	import { getGeoShapePath, getDisplayValues, type GeoShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import RichTextLabel from '../shared/RichTextLabel.svelte';

	let { shape }: { shape: TLGeoShape } = $props();

	const editor = getEditor();

	// Real display values from the real GeoShapeUtil options (strokeColor,
	// strokeWidth, fillColor, plus the full set of label values) — exactly what the
	// React GeoShapeBody + label read.
	const util = $derived(editor.getShapeUtil(shape) as GeoShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			strokeColor: string;
			strokeWidth: number;
			fillColor: string;
			labelColor: string;
			labelFontFamily: string;
			labelFontSize: number;
			labelLineHeight: number;
			labelHorizontalAlign: string;
			labelVerticalAlign: string;
			labelPadding: number;
		}
	);

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
		if (dash !== 'dashed' && dash !== 'dotted') {
			// 'solid' (and any non-dashed value) → one plain path.
			return [{ d: path.toD() }];
		}
		// dashed / dotted: one sub-path per command run, each dashed over its OWN
		// length with 'outset' joints at corners — a faithful port of upstream
		// PathBuilder.toDashedSvg (GeoShapeBody passes only { style, strokeWidth }).
		// This makes dashes align cleanly to every edge/corner instead of wrapping
		// the whole perimeter as one continuous stroke.
		return path
			.toDashedSegments({ style: dash, strokeWidth })
			.map((s) => ({ d: s.d, dasharray: s.strokeDasharray, dashoffset: s.strokeDashoffset }));
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

<!-- Geo shapes carry a rich-text label (double-click to edit). It reflects the
     font / horizontal + vertical align / size style props — the same RichTextLabel
     the note and text shapes use. -->
<RichTextLabel
	shapeId={shape.id}
	type="geo"
	richText={shape.props.richText}
	fontFamily={dv.labelFontFamily}
	fontSize={dv.labelFontSize}
	lineHeight={dv.labelLineHeight}
	textAlign={dv.labelHorizontalAlign}
	verticalAlign={dv.labelVerticalAlign}
	labelColor={dv.labelColor}
	padding={dv.labelPadding}
	wrap
/>

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
