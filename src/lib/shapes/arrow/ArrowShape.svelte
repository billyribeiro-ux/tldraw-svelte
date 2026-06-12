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
	const showLabel = $derived(
		!!labelBox && (isEditing || !isEmptyRichText(shape.props.richText))
	);

	const bodyD = $derived.by(() => {
		if (!info || !info.isValid) return '';
		const builder = getArrowBodyPathBuilder(info);
		const dash = shape.props.dash;
		return dash === 'draw'
			? builder.toDrawD({ strokeWidth: sw, randomSeed: shape.id, passes: 1, offset: 0 })
			: builder.toD();
	});

	const startHead = $derived(info && info.isValid ? getArrowheadPathForType(info, 'start', sw) : undefined);
	const endHead = $derived(info && info.isValid ? getArrowheadPathForType(info, 'end', sw) : undefined);
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
		{#if bodyD}
			<path d={bodyD} />
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
		style:border-radius="{dv.labelBorderRadius}px"
	>
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
			padding={dv.labelPadding}
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
	/* Label background matches the canvas so it reads over the arrow body, exactly
	   like tldraw's ArrowSvg label rect. */
	.tl-arrow-label {
		position: absolute;
		background: var(--tl-canvas-bg, #fff);
		pointer-events: none;
	}
</style>
