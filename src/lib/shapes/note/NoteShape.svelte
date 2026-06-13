<script lang="ts">
	import type { TLNoteShape } from '@tldraw/tlschema';
	import {
		getDisplayValues,
		getNoteHeight,
		getNoteShadow,
		type NoteShapeUtil
	} from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import RichTextLabel from '../shared/RichTextLabel.svelte';

	let { shape }: { shape: TLNoteShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's NoteShapeUtil.component(): a container div (sticky
	// background + bottom border / drop shadow) wrapping a RichTextLabel.
	const util = $derived(editor.getShapeUtil(shape) as NoteShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			noteWidth: number;
			noteHeight: number;
			noteBackgroundColor: string;
			borderColor: string;
			borderWidth: number;
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
	const nw = $derived(dv.noteWidth * scale);
	const nh = $derived(getNoteHeight(shape, dv.noteHeight));

	// Reactive rotation for the drop shadow (matches tldraw's useValue).
	const rotation = fromComputed(
		'note rotation',
		() => editor.getShapePageTransform(shape.id)?.rotation() ?? 0
	);
	const zoom = $derived(editor.getEfficientZoomLevel());
	const hideShadows = $derived(zoom < 0.25 / scale);
	const fontSizeAdjustment = $derived(shape.props.fontSizeAdjustment ?? 1);
</script>

<div
	class="tl-note__container"
	style:width="{nw}px"
	style:height="{nh}px"
	style:background-color={dv.noteBackgroundColor}
	style:border-bottom={hideShadows ? `${dv.borderWidth * scale}px solid ${dv.borderColor}` : 'none'}
	style:box-shadow={hideShadows ? 'none' : getNoteShadow(shape.id, rotation.current, scale)}
>
	<RichTextLabel
		shapeId={shape.id}
		type="note"
		richText={shape.props.richText}
		fontFamily={dv.labelFontFamily}
		fontSize={fontSizeAdjustment * dv.labelFontSize}
		lineHeight={dv.labelLineHeight}
		textAlign={dv.labelHorizontalAlign}
		verticalAlign={dv.labelVerticalAlign}
		labelColor={dv.labelColor}
		padding={dv.labelPadding}
		wrap
	/>
</div>

<style>
	.tl-note__container {
		position: absolute;
		inset: 0;
		border-radius: 1px;
		pointer-events: all;
	}
</style>
