<script lang="ts">
	import type { TLEmbedShape } from '@tldraw/tlschema';
	import { getRotatedBoxShadow, type EmbedShapeUtil } from '@tldraw/tldraw';
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';

	let { shape }: { shape: TLEmbedShape } = $props();
	const editor = getEditor();

	// Faithful port of tldraw's EmbedShapeUtil.component(): an <iframe> from the
	// embed definition's embedUrl, interactive only while editing/hovered.
	const util = $derived(editor.getShapeUtil(shape) as EmbedShapeUtil);
	const embedInfo = $derived(util.getEmbedDefinition(shape.props.url));
	const iframeSrc = $derived(embedInfo?.embedUrl ?? shape.props.url);

	const editingId = fromComputed('editing shape id', () => editor.getEditingShapeId());
	const isEditing = $derived(editingId.current === shape.id);

	const rotation = fromComputed(
		'embed rotation',
		() => editor.getShapePageTransform(shape.id)?.rotation() ?? 0
	);
	const radius = $derived(embedInfo?.definition?.overrideOutlineRadius ?? 8);
	const background = $derived(embedInfo?.definition?.backgroundColor);
</script>

<div class="tl-embed-container">
	{#if iframeSrc}
		<!-- iframes are focusable interactive content; tldraw manages their tab
		     order (focusable while editing, removed otherwise). -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			class="tl-embed"
			title={embedInfo?.definition?.title ?? 'Embedded content'}
			src={iframeSrc}
			width={shape.props.w}
			height={shape.props.h}
			draggable="false"
			referrerpolicy="strict-origin-when-cross-origin"
			tabindex={isEditing ? undefined : -1}
			allowfullscreen
			sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
			style:pointer-events={isEditing ? 'auto' : 'none'}
			style:box-shadow={getRotatedBoxShadow(rotation.current)}
			style:border-radius="{radius}px"
			style:background
		></iframe>
	{:else}
		<div class="tl-embed-fallback">{shape.props.url}</div>
	{/if}
</div>

<style>
	.tl-embed-container {
		position: absolute;
		inset: 0;
		pointer-events: all;
	}
	.tl-embed {
		width: 100%;
		height: 100%;
		border: 0;
		display: block;
	}
	.tl-embed-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px;
		background: #fff;
		border-radius: 8px;
		font:
			400 13px/1.4 system-ui,
			sans-serif;
		color: #555;
		word-break: break-all;
	}
</style>
