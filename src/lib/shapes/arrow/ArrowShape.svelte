<script lang="ts">
	import type { TLArrowShape } from '@tldraw/tlschema';
	import {
		getArrowInfo,
		getArrowBodyPathBuilder,
		getArrowheadPathForType,
		getArrowLabelPosition,
		getDisplayValues,
		isEmptyRichText,
		type ArrowShapeUtil
	} from '@tldraw/tldraw';
	import { getPerfectDashProps } from '@tldraw/editor';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import RichTextLabel from '../shared/RichTextLabel.svelte';

	let { shape }: { shape: TLArrowShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's ArrowSvg body: real arrow info (straight/arc/
	// elbow + bindings) → body path + arrowhead paths + rich-text label. Display
	// values (strokeColor/Width/fillColor + label values) from the real
	// ArrowShapeUtil options.
	const util = $derived(editor.getShapeUtil(shape) as ArrowShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			strokeColor: string;
			strokeWidth: number;
			fillColor: string;
			labelColor: string;
			labelFontFamily: string;
			labelFontSize: number;
			labelLineHeight: number;
			labelPadding: number;
			labelBorderRadius: number;
		}
	);
	const sw = $derived(dv.strokeWidth * shape.props.scale);
	// The label box already bakes in labelPadding*2*scale of padding (see
	// getArrowLabelPosition). Inset the background by labelPadding*scale per side
	// so it hugs the text bounds rather than the oversized full box.
	const labelPad = $derived(dv.labelPadding * shape.props.scale);

	const info = $derived(getArrowInfo(editor, shape));

	// Rich-text label, positioned at the arrow's label box (getArrowLabelPosition,
	// shape-local coords). Shown while editing or when the arrow has label text.
	const editingId = fromComputed('arrow editing id', () => editor.getEditingShapeId());
	const isEditing = $derived(editingId.current === shape.id);
	const labelBox = $derived.by(() => {
		try {
			return getArrowLabelPosition(editor, shape, isEditing).box;
		} catch {
			return null;
		}
	});
	const showLabel = $derived(!!labelBox && (isEditing || !isEmptyRichText(shape.props.richText)));

	// Body path data + (for dashed/dotted) the stroke-dasharray/dashoffset that
	// reproduce tldraw's PathBuilder.toDashedSvg() for the arrow body. The arrow
	// body is a single open run, so we dash the whole path over its geometry
	// length with start/end terminals of 'none' (matching the open-path defaults
	// in toDashedSvg), mirroring GeoShape.svelte's approach.
	const body = $derived.by((): { d: string; dasharray?: string; dashoffset?: string } => {
		if (!info || !info.isValid) return { d: '' };
		const builder = getArrowBodyPathBuilder(info);
		const dash = shape.props.dash;
		if (dash === 'draw') {
			return {
				d: builder.toDrawD({ strokeWidth: sw, randomSeed: shape.id, passes: 1, offset: 0 })
			};
		}
		if (dash === 'dashed' || dash === 'dotted') {
			const length = builder.toGeometry().length || 1;
			const { strokeDasharray, strokeDashoffset } = getPerfectDashProps(length, sw, {
				style: dash,
				start: 'none',
				end: 'none'
			});
			return { d: builder.toD(), dasharray: strokeDasharray, dashoffset: strokeDashoffset };
		}
		return { d: builder.toD() };
	});

	const startHead = $derived(
		info && info.isValid ? getArrowheadPathForType(info, 'start', sw) : undefined
	);
	const endHead = $derived(
		info && info.isValid ? getArrowheadPathForType(info, 'end', sw) : undefined
	);
	const fillsHead = $derived(shape.props.fill !== 'none');
</script>

<svg class="tl-arrow">
	<g
		fill="none"
		stroke={dv.strokeColor}
		stroke-width={sw}
		stroke-linejoin="round"
		stroke-linecap="round"
	>
		{#if body.d}
			<path d={body.d} stroke-dasharray={body.dasharray} stroke-dashoffset={body.dashoffset} />
		{/if}
		{#if startHead}
			{#if fillsHead}
				<path d={startHead} fill={dv.fillColor} />
			{/if}
			<path d={startHead} />
		{/if}
		{#if endHead}
			{#if fillsHead}
				<path d={endHead} fill={dv.fillColor} />
			{/if}
			<path d={endHead} />
		{/if}
	</g>
</svg>

{#if showLabel && labelBox}
	<div
		class="tl-arrow-label"
		style:left="{labelBox.x}px"
		style:top="{labelBox.y}px"
		style:width="{labelBox.w}px"
		style:height="{labelBox.h}px"
	>
		<!-- Canvas-colored background so the label reads over the arrow body, exactly
		     like tldraw's ArrowSvg label clip. The label box already includes
		     labelPadding*2*scale of padding (see getArrowLabelPosition), so the
		     background is inset by labelPadding*scale per side to the text bounds
		     and rounded with labelBorderRadius. -->
		<div
			class="tl-arrow-label__bg"
			style:inset="{labelPad}px"
			style:border-radius="{dv.labelBorderRadius * shape.props.scale}px"
		></div>
		<RichTextLabel
			shapeId={shape.id}
			type="arrow"
			richText={shape.props.richText}
			fontFamily={dv.labelFontFamily}
			fontSize={dv.labelFontSize}
			lineHeight={dv.labelLineHeight}
			textAlign="center"
			verticalAlign="middle"
			labelColor={dv.labelColor}
			padding={0}
		/>
	</div>
{/if}

<style>
	.tl-arrow {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
	.tl-arrow-label {
		position: absolute;
		pointer-events: none;
	}
	/* Inset, rounded background that matches the canvas so the label reads over the
	   arrow body, exactly like tldraw's ArrowSvg label rect (which is the label box
	   minus its padding). */
	.tl-arrow-label__bg {
		position: absolute;
		background: var(--tl-canvas-bg, #fff);
		pointer-events: none;
	}
</style>
