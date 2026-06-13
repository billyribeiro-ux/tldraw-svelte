<script lang="ts">
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	// The dot grid, shown when grid mode is on (View menu / toggle-grid). Drawn in
	// SCREEN space as an SVG pattern offset + scaled by the camera, exactly aligned
	// to the page grid (multiples of documentSettings.gridSize). Sits behind shapes.
	const editor = getEditor();
	const grid = fromComputed('grid', () => {
		if (!editor.getInstanceState().isGridMode) return null;
		const { x, y, z } = editor.getCamera();
		return { x, y, z, size: editor.getDocumentSettings().gridSize };
	});

	// Unique pattern id so multiple editors on a page don't collide.
	const uid = 'tl-grid-' + Math.random().toString(36).slice(2);
</script>

{#if grid.current}
	{@const g = grid.current}
	{@const spacing = g.size * g.z}
	{#if spacing >= 4}
		<svg class="tl-grid" aria-hidden="true">
			<defs>
				<pattern
					id={uid}
					width={spacing}
					height={spacing}
					patternUnits="userSpaceOnUse"
					x={g.x * g.z}
					y={g.y * g.z}
				>
					<circle cx="0.5" cy="0.5" r="1" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#{uid})" />
		</svg>
	{/if}
{/if}

<style>
	.tl-grid {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		color: var(--tl-color-grid, hsl(0, 0%, 43%));
	}
	.tl-grid circle {
		fill: currentColor;
	}
</style>
