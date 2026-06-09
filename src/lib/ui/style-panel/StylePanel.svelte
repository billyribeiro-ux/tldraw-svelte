<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { StylePanelModel } from './style-panel.svelte';
	import StylePanelContent from './StylePanelContent.svelte';

	// From-scratch desktop StylePanel (port of tldraw's StylePanel): the panel chrome
	// (panel background, 148px width, shadow) wrapping the shared StylePanelContent.
	// Shown whenever the selection exposes any shared styles.
	const editor = getEditor();
	const model = new StylePanelModel(editor);

	const styles = $derived(model.styles.current);
</script>

{#if styles.size > 0}
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
