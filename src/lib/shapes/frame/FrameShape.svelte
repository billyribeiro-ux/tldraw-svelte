<script lang="ts">
	import type { TLFrameShape } from '@tldraw/tlschema';
	import { getDisplayValues, defaultEmptyAs, type FrameShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	let { shape }: { shape: TLFrameShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's FrameShapeUtil.component(): an SVG <rect> body + the
	// heading label. Display values (fill/stroke/heading colors) from the real
	// FrameShapeUtil options. Double-click the heading to rename the frame.
	const util = $derived(editor.getShapeUtil(shape) as FrameShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			fillColor: string;
			strokeColor: string;
			headingFillColor: string;
			headingStrokeColor: string;
			headingTextColor: string;
		}
	);
	const name = $derived(defaultEmptyAs(shape.props.name, 'Frame'));

	// Inline rename: double-click puts the frame into the editor's editing state and
	// the heading becomes an input bound to props.name.
	const editingId = fromComputed('frame editing id', () => editor.getEditingShapeId());
	const isEditing = $derived(editingId.current === shape.id);

	function startEdit() {
		editor.markHistoryStoppingPoint('rename frame');
		editor.setEditingShape(shape.id);
	}
	function commit(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		editor.updateShape({ id: shape.id, type: 'frame', props: { name: value } });
	}
	function stopEdit() {
		if (editor.getEditingShapeId() === shape.id) editor.setEditingShape(null);
	}
	function focusOnMount(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<div class="tl-frame" style:width="{shape.props.w}px" style:height="{shape.props.h}px">
	<svg class="tl-frame__svg" width={shape.props.w} height={shape.props.h}>
		<rect
			class="tl-frame__body"
			x="0"
			y="0"
			width={shape.props.w}
			height={shape.props.h}
			fill={dv.fillColor}
			stroke={dv.strokeColor}
			stroke-width="1"
		/>
	</svg>
	{#if isEditing}
		<input
			class="tl-frame__heading tl-frame__heading--input"
			style:background={dv.headingFillColor}
			style:border-color={dv.headingStrokeColor}
			style:color={dv.headingTextColor}
			value={shape.props.name}
			placeholder="Frame"
			aria-label="Frame name"
			oninput={commit}
			onblur={stopEdit}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === 'Escape') stopEdit();
			}}
			{@attach focusOnMount}
		/>
	{:else}
		<div
			class="tl-frame__heading"
			style:background={dv.headingFillColor}
			style:border-color={dv.headingStrokeColor}
			style:color={dv.headingTextColor}
			role="button"
			tabindex="-1"
			ondblclick={startEdit}
		>
			{name}
		</div>
	{/if}
</div>

<style>
	.tl-frame {
		position: absolute;
		inset: 0;
		pointer-events: all;
	}
	.tl-frame__svg {
		position: absolute;
		inset: 0;
		overflow: visible;
	}
	.tl-frame__heading {
		position: absolute;
		bottom: 100%;
		left: 0;
		max-width: 100%;
		padding: 2px 8px;
		font:
			500 12px/1.4 system-ui,
			sans-serif;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border: 1px solid transparent;
		border-radius: 4px 4px 0 0;
	}
	.tl-frame__heading--input {
		outline: none;
		min-width: 60px;
	}
</style>
