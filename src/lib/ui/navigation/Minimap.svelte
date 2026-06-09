<script lang="ts">
	import { Box, Vec } from '@tldraw/editor';
	import { getEditor } from '$lib/ui/context';
	import { rafReactor } from '$lib/state-svelte';

	// From-scratch Minimap (port of tldraw's Minimap + MinimapManager). Draws the
	// current page's shape bounds and the viewport rectangle into a 2D canvas,
	// re-rendering whenever the camera or shapes change (rafReactor over the real
	// signals). Clicking / dragging the minimap pans the camera via centerOnPoint.
	const editor = getEditor();

	let canvas: HTMLCanvasElement | undefined;
	let isDragging = $state(false);

	const PADDING = 8;
	const WIDTH = 180;
	const HEIGHT = 120;

	/** The page region the minimap maps from: page content union viewport, padded. */
	function getMinimapPageBounds(): Box {
		const content = editor.getCurrentPageBounds();
		const viewport = editor.getViewportPageBounds();
		const bounds = content ? Box.From(content).clone() : viewport.clone();
		bounds.union(viewport);
		bounds.expandBy(Math.max(bounds.width, bounds.height) * 0.1 + 1);
		return bounds;
	}

	/** Scale + offset mapping page coords → minimap canvas coords (contain-fit). */
	function getTransform(pageBounds: Box, dpr: number) {
		const sx = (WIDTH - PADDING * 2) / pageBounds.width;
		const sy = (HEIGHT - PADDING * 2) / pageBounds.height;
		const scale = Math.min(sx, sy);
		const offsetX = (WIDTH - pageBounds.width * scale) / 2;
		const offsetY = (HEIGHT - pageBounds.height * scale) / 2;
		return { scale: scale * dpr, offsetX: offsetX * dpr, offsetY: offsetY * dpr, pageBounds };
	}

	function draw(ctx: CanvasRenderingContext2D, dpr: number) {
		const pageBounds = getMinimapPageBounds();
		const { scale, offsetX, offsetY } = getTransform(pageBounds, dpr);
		const toX = (px: number) => (px - pageBounds.minX) * scale + offsetX;
		const toY = (py: number) => (py - pageBounds.minY) * scale + offsetY;

		ctx.clearRect(0, 0, WIDTH * dpr, HEIGHT * dpr);

		// Shape bounds as soft filled rects.
		ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
		for (const id of editor.getCurrentPageShapeIds()) {
			const b = editor.getShapePageBounds(id);
			if (!b) continue;
			ctx.fillRect(
				toX(b.minX),
				toY(b.minY),
				Math.max(1, b.width * scale),
				Math.max(1, b.height * scale)
			);
		}

		// Viewport rectangle (canvas needs a concrete color, not a CSS var).
		const vp = editor.getViewportPageBounds();
		ctx.lineWidth = 2 * dpr;
		ctx.strokeStyle = '#4465e9';
		ctx.strokeRect(toX(vp.minX), toY(vp.minY), vp.width * scale, vp.height * scale);
	}

	function setupCanvas(node: HTMLCanvasElement) {
		canvas = node;
		const dpr = window.devicePixelRatio || 1;
		node.width = WIDTH * dpr;
		node.height = HEIGHT * dpr;
		const ctx = node.getContext('2d');
		if (!ctx) return;
		// Re-draw on every camera / shape change.
		const dispose = rafReactor('minimap', () => draw(ctx, dpr));
		return () => {
			dispose();
			canvas = undefined;
		};
	}

	/** Map a pointer event on the minimap to a page point and center the camera. */
	function panToEvent(e: PointerEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const pageBounds = getMinimapPageBounds();
		const { scale } = getTransform(pageBounds, 1);
		const offsetX = (WIDTH - pageBounds.width * scale) / 2;
		const offsetY = (HEIGHT - pageBounds.height * scale) / 2;
		const localX = e.clientX - rect.left;
		const localY = e.clientY - rect.top;
		const pageX = (localX - offsetX) / scale + pageBounds.minX;
		const pageY = (localY - offsetY) / scale + pageBounds.minY;
		editor.centerOnPoint(new Vec(pageX, pageY));
	}

	function onpointerdown(e: PointerEvent) {
		isDragging = true;
		canvas?.setPointerCapture(e.pointerId);
		panToEvent(e);
	}
	function onpointermove(e: PointerEvent) {
		if (isDragging) panToEvent(e);
	}
	function onpointerup(e: PointerEvent) {
		isDragging = false;
		canvas?.releasePointerCapture(e.pointerId);
	}
</script>

<canvas
	class="tlui-minimap"
	style:width="{WIDTH}px"
	style:height="{HEIGHT}px"
	aria-label="Minimap"
	data-testid="minimap"
	{@attach setupCanvas}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
></canvas>

<style>
	.tlui-minimap {
		display: block;
		border-radius: 9px;
		background: var(--tl-color-low, #f9f9f9);
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		touch-action: none;
	}
</style>
