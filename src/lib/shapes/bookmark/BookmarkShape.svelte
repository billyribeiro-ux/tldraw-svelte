<script lang="ts">
	import type { TLBookmarkShape } from '@tldraw/tlschema';
	import {
		convertCommonTitleHTMLEntities,
		getHumanReadableAddress,
		getRotatedBoxShadow,
		LINK_ICON
	} from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	let { shape }: { shape: TLBookmarkShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's bookmark preview card: image + title +
	// description + favicon/address. Asset record read synchronously.
	const asset = $derived(
		shape.props.assetId
			? (editor.getAsset(shape.props.assetId) as {
					props: { image?: string; title?: string; description?: string; favicon?: string };
				} | null)
			: null
	);
	const url = $derived(shape.props.url);
	const address = $derived(url ? getHumanReadableAddress(url) : '');

	const rotation = fromComputed(
		'bookmark rotation',
		() => editor.getShapePageTransform(shape.id)?.rotation() ?? 0
	);

	let faviconValid = $state(true);
</script>

<div
	class="tl-bookmark__container"
	style:box-shadow={getRotatedBoxShadow(rotation.current)}
	style:max-height="{shape.props.h}px"
>
	{#if !asset || asset.props.image}
		<div class="tl-bookmark__image_container">
			{#if asset?.props.image}
				<img
					class="tl-bookmark__image"
					src={asset.props.image}
					alt={asset.props.title || ''}
					draggable="false"
					referrerpolicy="strict-origin-when-cross-origin"
				/>
			{:else}
				<div class="tl-bookmark__placeholder"></div>
			{/if}
		</div>
	{/if}
	<div class="tl-bookmark__copy_container">
		{#if asset?.props.title}
			<!-- External bookmark URL — a raw href is correct here (not app routing). -->
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a class="tl-bookmark__link" href={url || ''} target="_blank" rel="noopener noreferrer">
				<h2 class="tl-bookmark__heading">{convertCommonTitleHTMLEntities(asset.props.title)}</h2>
			</a>
		{/if}
		{#if asset?.props.description && asset?.props.image}
			<p class="tl-bookmark__description">{asset.props.description}</p>
		{/if}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="tl-bookmark__link" href={url || ''} target="_blank" rel="noopener noreferrer">
			{#if faviconValid && asset?.props.favicon}
				<img
					class="tl-bookmark__favicon"
					src={asset.props.favicon}
					alt="favicon of {address}"
					referrerpolicy="strict-origin-when-cross-origin"
					onerror={() => (faviconValid = false)}
				/>
			{:else}
				<div
					class="tl-bookmark__favicon-fallback"
					style:mask={`url("${LINK_ICON}") center / contain no-repeat`}
					style:-webkit-mask={`url("${LINK_ICON}") center / contain no-repeat`}
				></div>
			{/if}
			<span>{address}</span>
		</a>
	</div>
</div>

<style>
	.tl-bookmark__container {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: 8px;
		background: #fff;
		pointer-events: all;
	}
	.tl-bookmark__image_container {
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}
	.tl-bookmark__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.tl-bookmark__placeholder {
		width: 100%;
		height: 100%;
		background: #f0f0f0;
	}
	.tl-bookmark__copy_container {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow: hidden;
	}
	.tl-bookmark__link {
		display: flex;
		align-items: center;
		gap: 6px;
		color: inherit;
		text-decoration: none;
	}
	.tl-bookmark__heading {
		margin: 0;
		font:
			600 15px/1.3 system-ui,
			sans-serif;
		color: #1d1d1d;
	}
	.tl-bookmark__description {
		margin: 0;
		font:
			400 13px/1.4 system-ui,
			sans-serif;
		color: #555;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.tl-bookmark__favicon,
	.tl-bookmark__favicon-fallback {
		width: 16px;
		height: 16px;
		background-color: #777;
	}
	.tl-bookmark__favicon {
		background: none;
	}
	.tl-bookmark__copy_container span {
		font:
			400 12px/1 system-ui,
			sans-serif;
		color: #777;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
