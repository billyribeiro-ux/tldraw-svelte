<script lang="ts">
	import type { TLDefaultColorStyle } from '@tldraw/editor';
	import { DefaultColorStyle } from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import Icon from '../Icon.svelte';

	// Code-faithful port of tldraw's color StylePanelButtonPicker (StylePanelButtonPicker.tsx
	// + styles.tsx): each item is the shared `color` mask icon with inline
	// `color: getColorValue(...)`, so the glyph is tinted per swatch. items.length > 4
	// → TldrawUiGrid (4 columns). No row heading text (enhancedA11yMode is off).
	let { model }: { model: StylePanelModel } = $props();

	const current = $derived(model.getValue(DefaultColorStyle));
	const names = $derived(DefaultColorStyle.values as TLDefaultColorStyle[]);
</script>

<div class="tlui-color-grid" role="radiogroup" aria-label="Color" data-testid="style.color">
	{#each names as name (name)}
		<button
			class="tlui-color-btn"
			class:tlui-color-btn--active={current === name}
			type="button"
			role="radio"
			aria-checked={current === name}
			data-id={name}
			data-testid="style.color.{name}"
			data-value={name}
			data-isactive={current === name}
			title="Color — {name}"
			aria-label="Color — {name}"
			style:color={model.colorCss(name)}
			onclick={() => model.setStyle(DefaultColorStyle, name)}
		>
			<Icon icon="color" label="" />
		</button>
	{/each}
</div>

<style>
	/* tldraw's color grid (.tlui-grid): 4 equal columns, `padding: 2px`. Each swatch
	   is a FIXED 40px square (matching .tlui-toolbar-toggle-group-item), not a 1fr
	   cell stretched square via aspect-ratio. */
	.tlui-color-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-auto-flow: row;
		overflow: hidden;
		padding: 2px;
	}
	.tlui-color-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		min-width: 0;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		z-index: 0;
	}
	.tlui-color-btn::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		z-index: -1;
	}
	.tlui-color-btn:hover::after {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	/* Selected swatch keeps its --tl-color-hint highlight on hover (a bare :hover::after
	   would otherwise outrank --active::after and make the highlight vanish), matching
	   StylePropPicker. */
	.tlui-color-btn--active::after,
	.tlui-color-btn--active:hover::after {
		background: var(--tl-color-hint, rgba(0, 0, 0, 0.055));
	}
</style>
