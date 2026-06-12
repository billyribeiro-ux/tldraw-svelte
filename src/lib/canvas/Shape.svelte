<script lang="ts">
	import { Mat, type TLShape, type TLShapeId } from '@tldraw/editor';
	import { getEditor } from '$lib/state-svelte';
	import { quickReactor } from '$lib/state-svelte/reactor.svelte';
	import { getShapeComponent } from '$lib/shapes/registry';

	let {
		id,
		shape,
		index,
		opacity
	}: { id: TLShapeId; shape: TLShape; index: number; opacity: number } = $props();

	const editor = getEditor();

	const ShapeComponent = $derived(getShapeComponent(shape.type));

	// Mirror of tldraw's React `useQuickReactor('set shape stuff')`: imperatively
	// write transform/width/height/clip-path onto the container whenever the
	// shape's page transform or geometry changes. Runs synchronously via a tldraw
	// EffectScheduler (not Svelte's batched microtask queue) so dragging is smooth
	// and free of layout-shift. Driven through the state-svelte bridge.
	function positionContainer(node: HTMLElement) {
		const prev = { transform: '', width: 0, height: 0, clipPath: 'none' };
		return quickReactor(`shape:${id}`, () => {
			const s = editor.getShape(id);
			if (!s) return;

			const clipPath = editor.getShapeClipPath(id) ?? 'none';
			if (clipPath !== prev.clipPath) {
				node.style.clipPath = clipPath;
				prev.clipPath = clipPath;
			}

			const transform = Mat.toCssString(editor.getShapePageTransform(id));
			if (transform !== prev.transform) {
				node.style.transform = transform;
				prev.transform = transform;
			}

			const bounds = editor.getShapeGeometry(s).bounds;
			const width = Math.max(bounds.width, 1);
			const height = Math.max(bounds.height, 1);
			if (width !== prev.width || height !== prev.height) {
				node.style.width = `${width}px`;
				node.style.height = `${height}px`;
				prev.width = width;
				prev.height = height;
			}
		});
	}
</script>

<div
	class="tl-shape"
	data-shape-type={shape.type}
	data-shape-id={id}
	style:z-index={index}
	style:opacity
	{@attach positionContainer}
>
	{#if ShapeComponent}
		<ShapeComponent {shape} />
	{/if}
</div>

<style>
	.tl-shape {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
		pointer-events: none;
		contain: size layout;
	}
</style>
