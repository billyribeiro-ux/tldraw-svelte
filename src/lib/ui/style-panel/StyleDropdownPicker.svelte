<script lang="ts" generics="T extends string">
	import type { StyleProp } from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import Popover from '../primitives/Popover.svelte';
	import Icon from '../Icon.svelte';

	// Faithful port of tldraw's StylePanelDropdownPicker: a `button__menu` showing the
	// title + the CURRENT value's icon, opening a popover whose content is a GRID of
	// icon-only toggle buttons (tldraw uses `orientation={items.length > 4 ? 'grid' :
	// 'horizontal'}`) — NOT a tall vertical labelled list. Each item's data-testid is
	// `style.<uiType>.<value>`; the trigger is `style.<uiType>`.
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

	let open = $state(false);

	const current = $derived(model.getValue(prop));
	const currentOption = $derived(options.find((o) => o.value === current));
	const currentIcon = $derived(currentOption?.icon ?? options[0]?.icon ?? 'geo-rectangle');
	// >4 options → grid (4 cols), else a single horizontal row, matching tldraw.
	const isGrid = $derived(options.length > 4);

	function choose(value: T) {
		model.setStyle(prop, value);
		open = false;
	}
</script>

<div class="tlui-style-panel__dropdown-picker">
	<Popover bind:open side="bottom" align="end">
		{#snippet trigger({ toggle, props })}
			<button
				class="tlui-style-menu-btn"
				type="button"
				{title}
				aria-label="{title} — {currentOption?.label ?? 'Mixed'}"
				data-testid="style.{uiType}"
				data-value={current}
				onclick={toggle}
				{...props}
			>
				<span class="tlui-style-menu-btn__label">{title}</span>
				<Icon icon={currentIcon} label="" />
			</button>
		{/snippet}
		<div
			class="tlui-style-dropdown__grid"
			class:tlui-style-dropdown__grid--row={!isGrid}
			role="radiogroup"
			aria-label={title}
			data-testid="style.{uiType}.menu"
		>
			{#each options as opt (opt.value)}
				<button
					class="tlui-style-icon-btn"
					class:tlui-style-icon-btn--active={current === opt.value}
					type="button"
					role="radio"
					aria-checked={current === opt.value}
					data-testid="style.{uiType}.{opt.value}"
					data-value={opt.value}
					title="{title} — {opt.label}"
					aria-label="{title} — {opt.label}"
					onclick={() => choose(opt.value)}
				>
					<Icon icon={opt.icon} label="" />
				</button>
			{/each}
		</div>
	</Popover>
</div>

<style>
	.tlui-style-panel__dropdown-picker {
		display: flex;
	}
	.tlui-style-panel__dropdown-picker :global(.tlui-popover) {
		flex: 1;
	}
	/* tldraw's .tlui-button__menu: label on the left, value icon on the right. */
	.tlui-style-menu-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		width: 100%;
		height: 40px;
		padding: 0 8px 0 12px;
		border: none;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		color: var(--tl-color-text-1, #2d2d2d);
		font: 500 12px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
	}
	.tlui-style-menu-btn:hover {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-style-menu-btn__label {
		flex: 1 1 auto;
	}
	/* The popover content: a compact 4-column grid of icon buttons (tldraw's
	   TldrawUiToolbar orientation="grid"), or a single row for <=4 options. */
	.tlui-style-dropdown__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
	}
	.tlui-style-dropdown__grid--row {
		grid-template-columns: repeat(var(--cols, 4), 1fr);
		display: flex;
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
	/* Selected wins on hover too (see StylePropPicker — :hover::after outranks
	   --active::after, which made the blue disappear on hover). */
	.tlui-style-icon-btn--active::after,
	.tlui-style-icon-btn--active:hover::after {
		background: var(--tl-color-selected, #4465e9);
	}
</style>
