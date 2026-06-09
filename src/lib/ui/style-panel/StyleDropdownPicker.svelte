<script lang="ts" generics="T extends string">
	import type { StyleProp } from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import Popover from '../primitives/Popover.svelte';
	import MenuItem from '../primitives/MenuItem.svelte';
	import Icon from '../Icon.svelte';

	// Code-faithful port of tldraw's StylePanelDropdownPicker: a single `button__menu`
	// showing the title label + the CURRENT value's icon, opening a dropdown of all
	// options. Used for large enums (geo/spline/arrowheads) that can't fit as button
	// rows. data-testid is `style.<uiType>`.
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
	const currentOption = $derived(options.find((o) => o.value === current));
	const currentIcon = $derived(currentOption?.icon ?? options[0]?.icon ?? 'geo-rectangle');
</script>

<div class="tlui-style-panel__dropdown-picker">
	<Popover side="bottom" align="end">
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
		<div class="tlui-style-dropdown__menu">
			{#each options as opt (opt.value)}
				<MenuItem
					label={opt.label}
					icon={opt.icon}
					checked={current === opt.value}
					onSelect={() => model.setStyle(prop, opt.value)}
				/>
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
	.tlui-style-dropdown__menu {
		max-height: 50vh;
		overflow-y: auto;
		text-transform: capitalize;
	}
</style>
