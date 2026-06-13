<script lang="ts">
	import type { TLTextShape } from '@tldraw/tlschema';
	import { getDisplayValues, type TextShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import RichTextLabel from '../shared/RichTextLabel.svelte';

	let { shape }: { shape: TLTextShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's TextShapeUtil.component(): a single RichTextLabel
	// (display + inline edit) using the real display values. Sizing comes from the
	// util's getMinDimensions method.
	const util = $derived(editor.getShapeUtil(shape) as TextShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			color: string;
			fontFamily: string;
			fontSize: number;
			lineHeight: number;
		}
	);
	const align = $derived(shape.props.textAlign === 'middle' ? 'center' : shape.props.textAlign);
</script>

<!-- tldraw's TextShapeUtil renders the RichTextLabel with
     `transform: scale(props.scale); transform-origin: top left` so a resized /
     scaled text shape sizes correctly (the geometry is also multiplied by
     scale). We wrap the label in a scaling div to reproduce that. -->
<div
	class="tl-text-scale"
	style:transform="scale({shape.props.scale})"
	style:transform-origin="top left"
>
	<RichTextLabel
		shapeId={shape.id}
		type="text"
		richText={shape.props.richText}
		fontFamily={dv.fontFamily}
		fontSize={dv.fontSize}
		lineHeight={dv.lineHeight}
		textAlign={align}
		verticalAlign="middle"
		labelColor={dv.color}
		wrap
	/>
</div>

<style>
	.tl-text-scale {
		position: absolute;
		inset: 0;
	}
</style>
