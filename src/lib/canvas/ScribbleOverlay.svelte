<script lang="ts">
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// From-scratch scribble overlay (the laser/eraser/brush scribbles tldraw draws via
	// editor.scribbles). Reads the reactive scribbles array from instance state and
	// renders each as an SVG polyline in page space (this lives inside the page-
	// transformed html layer). The 'laser' color renders as tldraw's red glow.
	const editor = getEditor();
	const scribbles = fromComputed('scribbles', () => editor.getInstanceState().scribbles);

	function pathFor(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		let d = `M${points[0].x},${points[0].y}`;
		for (let i = 1; i < points.length; i++) d += `L${points[i].x},${points[i].y}`;
		return d;
	}

	// tldraw's laser color is a red; named colors fall back to currentColor-ish.
	function strokeFor(color: string): string {
		return color === 'laser' ? '#ff0000' : 'var(--tl-color-text, #1d1d1d)';
	}
</script>

{#if scribbles.current.length > 0}
	<svg class="tl-scribbles" aria-hidden="true">
		{#each scribbles.current as scribble (scribble.id)}
			<path
				d={pathFor(scribble.points)}
				fill="none"
				stroke={strokeFor(scribble.color)}
				stroke-width={scribble.size}
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity={scribble.opacity}
				class:tl-scribbles__laser={scribble.color === 'laser'}
			/>
		{/each}
	</svg>
{/if}

<style>
	.tl-scribbles {
		position: absolute;
		top: 0;
		left: 0;
		width: 1px;
		height: 1px;
		overflow: visible;
		pointer-events: none;
		z-index: var(--tl-layer-overlays-user-scribble, 40);
	}
	/* The laser stroke gets a soft glow, matching tldraw's laser pointer. */
	.tl-scribbles__laser {
		filter: drop-shadow(0 0 4px #ff0000) drop-shadow(0 0 2px #ff5555);
	}
</style>
