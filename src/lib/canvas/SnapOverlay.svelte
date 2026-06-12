<script lang="ts">
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// Snap indicators (the blue alignment lines + gap markers shown while dragging or
	// resizing). The engine's SnapManager publishes them in page coordinates; we
	// render them inside the camera-transformed HTML layer and use
	// vector-effect:non-scaling-stroke so the lines stay 1px at any zoom.
	const editor = getEditor();
	const indicators = fromComputed('snap indicators', () => editor.snaps.getIndicators());
</script>

{#if indicators.current.length}
	<svg class="tl-snaps" aria-hidden="true">
		{#each indicators.current as ind (ind.id)}
			{#if ind.type === 'points'}
				<polyline points={ind.points.map((p) => `${p.x},${p.y}`).join(' ')} />
			{:else}
				{#each ind.gaps as gap, i (i)}
					<line
						x1={gap.startEdge[0].x}
						y1={gap.startEdge[0].y}
						x2={gap.startEdge[1].x}
						y2={gap.startEdge[1].y}
					/>
					<line
						x1={gap.endEdge[0].x}
						y1={gap.endEdge[0].y}
						x2={gap.endEdge[1].x}
						y2={gap.endEdge[1].y}
					/>
				{/each}
			{/if}
		{/each}
	</svg>
{/if}

<style>
	.tl-snaps {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		overflow: visible;
		pointer-events: none;
	}
	.tl-snaps :global(polyline),
	.tl-snaps :global(line) {
		fill: none;
		stroke: var(--tl-selection-color, #4465e9);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
</style>
