<script lang="ts" generics="T extends string">
	import type { StyleProp } from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import Icon from '../Icon.svelte';

	// Code-faithful port of tldraw's StylePanelButtonPicker (StylePanelButtonPicker.tsx):
	// a TldrawUiToolbarToggleGroup of icon toggle items, laid out as a Row (<=4 items)
	// or a Grid (>4). Each item is an icon button (no text); the data-testid is
	// `style.<uiType>.<value>`, the group is `style.<uiType>`. No heading text
	// (enhancedA11yMode off). Writing applies to selection + next shape via the model.
	interface Option {
		value: T;
		label: string;
		icon: string;
	}

	let {
		model,
		prop,
		title,
		uiType,
		options
	}: {
		model: StylePanelModel;
		prop: StyleProp<T>;
		title: string;
		uiType: string;
		options: Option[];
	} = $props();

	const current = $derived(model.getValue(prop));
	const isGrid = $derived(options.length > 4);
</script>

<div
	class="tlui-style-row"
	class:tlui-style-row--grid={isGrid}
	role="radiogroup"
	aria-label={title}
	data-testid="style.{uiType}"
>
	{#each options as opt (opt.value)}
		<button
			class="tlui-style-icon-btn"
			class:tlui-style-icon-btn--active={current === opt.value}
			type="button"
			role="radio"
			aria-checked={current === opt.value}
			data-id={opt.value}
			data-testid="style.{uiType}.{opt.value}"
			data-isactive={current === opt.value}
			data-value={opt.value}
			title="{title} — {opt.label}"
			aria-label="{title} — {opt.label}"
			onclick={() => model.setStyle(prop, opt.value)}
		>
			<Icon icon={opt.icon} label="" />
		</button>
	{/each}
</div>

<style>
	/* Row layout (<=4 items) — tldraw's TldrawUiRow. */
	.tlui-style-row {
		display: flex;
		flex-direction: row;
		gap: 0;
	}
	/* Grid layout (>4 items) — tldraw's TldrawUiGrid (4 columns of 40px). */
	.tlui-style-row--grid {
		display: grid;
		grid-template-columns: repeat(4, 40px);
		grid-auto-flow: row;
		overflow: hidden;
		padding: 2px;
	}
	.tlui-style-icon-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--tl-color-text-1, #2d2d2d);
		cursor: pointer;
		z-index: 0;
	}
	.tlui-style-icon-btn::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		z-index: -1;
	}
	.tlui-style-icon-btn:hover::after {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-style-icon-btn--active {
		color: var(--tl-color-selected-contrast, #fff);
	}
	.tlui-style-icon-btn--active::after {
		background: var(--tl-color-selected, #4465e9);
	}
</style>
