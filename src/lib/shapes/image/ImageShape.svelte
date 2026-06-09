<script lang="ts">
	import type { TLImageShape } from '@tldraw/tlschema';
	import { getEditor } from '$lib/state-svelte';
	import { AssetResolver } from '../shared/use-asset.svelte';

	let { shape }: { shape: TLImageShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's ImageShapeUtil.component(): an <img> sized to the
	// shape, with crop + flip transforms, resolved via the from-scratch
	// AssetResolver. Broken/missing asset shows a placeholder box.
	const resolver = new AssetResolver(
		editor,
		() => shape.id,
		() => shape.props.assetId,
		() => shape.props.w
	);

	const url = $derived(resolver.url);
	const crop = $derived(shape.props.crop);

	// Flip transform (port of getFlipStyle): scale(±1, ±1) around center.
	const flip = $derived(`scale(${shape.props.flipX ? -1 : 1}, ${shape.props.flipY ? -1 : 1})`);

	// Crop container: when cropped, the <img> is larger than the shape and shifted
	// so the crop window shows (port of getCroppedContainerStyle, simplified).
	const cropStyle = $derived.by(() => {
		if (!crop) return { width: '100%', height: '100%', transform: 'none' };
		const tl = crop.topLeft;
		const br = crop.bottomRight;
		const cw = br.x - tl.x;
		const ch = br.y - tl.y;
		const w = shape.props.w / Math.max(cw, 0.0001);
		const h = shape.props.h / Math.max(ch, 0.0001);
		return {
			width: `${w}px`,
			height: `${h}px`,
			transform: `translate(${-tl.x * w}px, ${-tl.y * h}px)`
		};
	});
</script>

<div
	class="tl-image-host"
	style:width="{shape.props.w}px"
	style:height="{shape.props.h}px"
	style:border-radius={crop?.isCircle ? '50%' : undefined}
>
	{#if url}
		<div
			class="tl-image-container"
			style:width={cropStyle.width}
			style:height={cropStyle.height}
			style:transform={cropStyle.transform}
		>
			<img
				class="tl-image"
				src={url}
				alt={shape.props.altText ?? ''}
				draggable="false"
				referrerpolicy="strict-origin-when-cross-origin"
				style:transform={flip}
			/>
		</div>
	{:else}
		<div class="tl-image-placeholder"></div>
	{/if}
</div>

<style>
	.tl-image-host {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: all;
	}
	.tl-image-container {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
	}
	.tl-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform-origin: center center;
		display: block;
	}
	.tl-image-placeholder {
		width: 100%;
		height: 100%;
		background: #e8e8e8;
		border: 1px solid #d0d0d0;
	}
</style>
