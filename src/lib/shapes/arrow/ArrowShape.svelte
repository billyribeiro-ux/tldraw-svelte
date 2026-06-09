<script lang="ts">
	import type { TLArrowShape } from '@tldraw/tlschema';
	import {
		getArrowInfo,
		getArrowBodyPathBuilder,
		getArrowheadPathForType,
		getDisplayValues,
		type ArrowShapeUtil
	} from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';

	let { shape }: { shape: TLArrowShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's ArrowSvg body: real arrow info (straight/arc/
	// elbow + bindings) → body path + arrowhead paths. Display values
	// (strokeColor/Width/fillColor) from the real ArrowShapeUtil options.
	// (Rich-text label is rendered in the text/note phase via the from-scratch
	// label component.)
	const util = $derived(editor.getShapeUtil(shape) as ArrowShapeUtil);
	const dv = $derived(
		getDisplayValues(util, shape) as {
			strokeColor: string;
			strokeWidth: number;
			fillColor: string;
		}
	);
	const sw = $derived(dv.strokeWidth * shape.props.scale);

	const info = $derived(getArrowInfo(editor, shape));

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

<style>
	.tl-arrow {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
</style>
