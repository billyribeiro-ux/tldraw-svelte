<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../Icon.svelte';
	import Kbd from './Kbd.svelte';
	import { getPopoverClose } from './popover-context.svelte';

	// If inside a Popover, activating closes it (after onSelect runs).
	const closePopover = getPopoverClose();

	// From-scratch menu item (no third-party UI lib). Mirrors tldraw's
	// TldrawUiMenuItem: icon + label + optional kbd + checkbox state.
	let {
		label,
		icon,
		kbd,
		checked,
		isActive = false,
		disabled = false,
		onSelect,
		children
	}: {
		label?: string;
		icon?: string;
		kbd?: string;
		checked?: boolean;
		isActive?: boolean;
		disabled?: boolean;
		onSelect?: () => void;
		children?: Snippet;
	} = $props();

	// Keyboard navigation (arrow keys) highlights an item without hovering it;
	// tldraw mirrors Radix's data-highlighted. Pointer movement clears it so the
	// pointer takes over (matching tldraw's "highlight follows pointer").
	let highlighted = $state(false);
</script>

<button
	class="tlui-menu-item"
	role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
	type="button"
	{disabled}
	aria-checked={checked === undefined ? undefined : checked}
	data-isactive={isActive}
	data-highlighted={highlighted ? '' : undefined}
	onclick={() => {
		onSelect?.();
		closePopover?.();
	}}
	onpointermove={() => (highlighted = false)}
	onfocus={() => (highlighted = true)}
	onblur={() => (highlighted = false)}
>
	{#if checked !== undefined}
		<span class="tlui-menu-item__check" aria-hidden="true">{checked ? '✓' : ''}</span>
	{/if}
	{#if icon}
		<span class="tlui-menu-item__icon"><Icon {icon} small /></span>
	{/if}
	<span class="tlui-menu-item__label"
		>{label}{#if children}{@render children()}{/if}</span
	>
	{#if kbd}
		<span class="tlui-menu-item__kbd"><Kbd {kbd} /></span>
	{/if}
</button>

<style>
	.tlui-menu-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-height: 32px;
		padding: 0 8px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		font: 500 13px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
		z-index: 0;
	}
	/* Inset overlay highlight (tldraw ui.css:101-119): a 4px-inset rounded rect
	   that is ALWAYS --tl-color-muted-2 with opacity toggled 0 → 1 on hover or
	   keyboard highlight. Active swaps the background to --tl-color-hint, so the
	   selected fill never greys out under hover. */
	.tlui-menu-item::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: var(--tl-color-muted-2, hsl(0, 0%, 0%, 4.3%));
		opacity: 0;
		z-index: -1;
	}
	.tlui-menu-item:hover:not(:disabled)::after,
	.tlui-menu-item[data-highlighted]:not(:disabled)::after {
		opacity: 1;
	}
	.tlui-menu-item[data-isactive='true']::after {
		background: var(--tl-color-hint, hsl(0, 0%, 0%, 5.5%));
		opacity: 1;
	}
	.tlui-menu-item:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.tlui-menu-item__check {
		width: 14px;
		text-align: center;
	}
	.tlui-menu-item__label {
		flex: 1 1 auto;
	}
	.tlui-menu-item__kbd {
		margin-left: auto;
		opacity: 0.6;
	}
</style>
