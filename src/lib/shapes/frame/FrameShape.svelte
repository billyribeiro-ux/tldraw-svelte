<script lang="ts">
	import type { TLFrameShape } from '@tldraw/tlschema';
	import { getDisplayValues, defaultEmptyAs, type FrameShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLFrameShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's FrameShapeUtil.component(): an SVG <rect> body +
	// the heading label. Display values (fill/stroke/heading colors) from the real
	// FrameShapeUtil options. Inline name-editing is wired in the text phase; the
	// name renders statically here. (showColors mode off by default.)
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
	<div
		class="tl-frame__heading"
		style:background={dv.headingFillColor}
		style:border-color={dv.headingStrokeColor}
		style:color={dv.headingTextColor}
	>
		{name}
	</div>
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
</style>
