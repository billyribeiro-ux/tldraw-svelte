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
		disabled = false,
		onSelect,
		children
	}: {
		label?: string;
		icon?: string;
		kbd?: string;
		checked?: boolean;
		disabled?: boolean;
		onSelect?: () => void;
		children?: Snippet;
	} = $props();
</script>

<button
	class="tlui-menu-item"
	role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
	type="button"
	{disabled}
	aria-checked={checked === undefined ? undefined : checked}
	onclick={() => {
		onSelect?.();
		closePopover?.();
	}}
>
	{#if checked !== undefined}
		<span class="tlui-menu-item__check" aria-hidden="true">{checked ? '✓' : ''}</span>
	{/if}
	{#if icon}
		<span class="tlui-menu-item__icon"><Icon {icon} small /></span>
	{/if}
	<span class="tlui-menu-item__label">{label}{#if children}{@render children()}{/if}</span>
	{#if kbd}
		<span class="tlui-menu-item__kbd"><Kbd {kbd} /></span>
	{/if}
</button>

<style>
	.tlui-menu-item {
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
		font:
			500 13px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
	}
	.tlui-menu-item:hover:not(:disabled) {
		background: var(--tl-color-hover, #f0f0f0);
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
