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
	/* The panel hugs its content (the 40px button rows / 4-col color grid), like
	   tldraw — a fixed narrow width would squeeze the rows. */
	.tlui-style-panel {
		display: flex;
		flex-direction: column;
		width: max-content;
		max-height: calc(100vh - 120px);
		overflow-y: auto;
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
	}
</style>
