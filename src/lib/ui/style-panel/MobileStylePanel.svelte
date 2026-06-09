<script lang="ts">
	import { DefaultColorStyle } from '@tldraw/editor';
	import { getEditor } from '$lib/ui/context';
	import { StylePanelModel } from './style-panel.svelte';
	import Popover from '../primitives/Popover.svelte';
	import StylePanelContent from './StylePanelContent.svelte';

	// From-scratch MobileStylePanel (port of tldraw's): on narrow screens the style
	// panel collapses to a single swatch button (showing the current color) that
	// opens the full panel in a popover. The swatch reflects the shared color, or a
	// neutral "mixed" look when the selection has multiple colors.
	const editor = getEditor();
	const model = new StylePanelModel(editor);

	const colorValue = $derived(model.getValue(DefaultColorStyle));
	const swatchCss = $derived(colorValue ? model.colorCss(colorValue) : 'var(--tl-color-text-3)');
</script>

<Popover side="top" align="end">
	{#snippet trigger({ toggle, props })}
		<button
			class="tlui-mobile-style"
			type="button"
			title="Style"
			aria-label="Style"
			onclick={toggle}
			{...props}
			data-testid="mobile-style.button"
		>
			<span class="tlui-mobile-style__swatch" style:background={swatchCss}></span>
		</button>
	{/snippet}
	<div class="tlui-mobile-style__panel" data-testid="mobile-style.panel">
		<StylePanelContent {model} />
	</div>
</Popover>

<style>
	.tlui-mobile-style {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		padding: 0;
		border: none;
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
	}
	.tlui-mobile-style:hover {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-mobile-style__swatch {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		box-shadow: inset 0 0 0 1px var(--tl-color-muted-1, rgba(0, 0, 0, 0.1));
	}
	.tlui-mobile-style__panel {
		width: 148px;
		max-height: 70vh;
		overflow-y: auto;
	}
</style>
