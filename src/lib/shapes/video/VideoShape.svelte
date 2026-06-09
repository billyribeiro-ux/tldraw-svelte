<script lang="ts">
	import type { TLVideoShape } from '@tldraw/tlschema';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import { AssetResolver } from '../shared/use-asset.svelte';

	let { shape }: { shape: TLVideoShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's VideoShapeUtil.component(): a <video> resolved via
	// AssetResolver; controls show only while editing.
	const resolver = new AssetResolver(
		editor,
		() => shape.id,
		() => shape.props.assetId,
		() => shape.props.w
	);
	const url = $derived(resolver.url);

	const editingId = fromComputed('editing shape id', () => editor.getEditingShapeId());
	const isEditing = $derived(editingId.current === shape.id);
</script>

<div class="tl-video-host">
	{#if url}
		<video
			class="tl-video"
			src={url}
			width="100%"
			height="100%"
			playsinline
			muted
			loop
			autoplay={shape.props.autoplay}
			controls={isEditing}
			draggable="false"
			aria-label={shape.props.altText ?? ''}
			style:pointer-events={isEditing ? 'all' : 'none'}
		></video>
	{:else}
		<div class="tl-video-placeholder"></div>
	{/if}
</div>

<style>
	.tl-video-host {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: all;
	}
	.tl-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.tl-video-placeholder {
		width: 100%;
		height: 100%;
		background: #e8e8e8;
		border: 1px solid #d0d0d0;
	}
</style>
