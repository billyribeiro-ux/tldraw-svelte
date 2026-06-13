<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { StylePanelModel } from './style-panel.svelte';
	import StylePanelContent from './StylePanelContent.svelte';

	// From-scratch desktop StylePanel (port of tldraw's StylePanel): the panel chrome
	// wrapping the shared StylePanelContent. Shown whenever tldraw would show it —
	// including while a drawing tool is active with nothing selected, so you can set
	// styles (color, line thickness, etc.) BEFORE drawing.
	const editor = getEditor();
	const model = new StylePanelModel(editor);

	const visible = $derived(model.isVisible.current);
</script>

{#if visible}
	<div class="tlui-style-panel" data-testid="style-panel">
		<StylePanelContent {model} />
	</div>
{/if}

<style>
	/* tldraw's style panel is a fixed 148px (max-width 148px), per ui.css:1096
	   (position / z-index / pointer-events / width). It carries NO overflow and NO
	   max-height: the dropdown pickers fly out to the LEFT of the panel, and ANY
	   overflow here (even overflow-y) forces overflow-x to clip per the CSS spec,
	   hiding that flyout behind the canvas. Upstream avoids this by portaling its
	   popovers; we keep the panel unclipped so the inline flyout paints above the
	   canvas (the panel's --tl-layer-panels stacking context sits above it). */
	.tlui-style-panel {
		position: relative;
		z-index: var(--tl-layer-panels, 300);
		display: flex;
		flex-direction: column;
		width: 148px;
		max-width: 148px;
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
	}
</style>
