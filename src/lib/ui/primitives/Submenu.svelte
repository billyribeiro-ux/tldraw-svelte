<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../Icon.svelte';

	// From-scratch submenu (port of tldraw's TldrawUiMenuSubmenu, no third-party lib).
	// A menu row with a trailing chevron; clicking it expands a nested flyout panel to
	// the right (left if there's no room). Unlike a plain MenuItem it does NOT close
	// the enclosing popover — it toggles its own flyout. Closes on outside pointerdown.
	let {
		label,
		side = 'right',
		children
	}: {
		label: string;
		/** Which side the flyout opens toward (use 'left' near the right screen edge). */
		side?: 'right' | 'left';
		children: Snippet;
	} = $props();

	let open = $state(false);
	let root: HTMLElement | undefined;

	function captureRoot(node: HTMLElement) {
		root = node;
		return () => {
			root = undefined;
		};
	}

	function onpointerdown(e: PointerEvent) {
		if (!open) return;
		const t = e.target as Node;
		if (root && !root.contains(t)) open = false;
	}
</script>

<svelte:document {onpointerdown} />

<div class="tlui-submenu" {@attach captureRoot}>
	<button
		class="tlui-submenu__trigger"
		type="button"
		role="menuitem"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<span class="tlui-submenu__label">{label}</span>
		<span class="tlui-submenu__chevron" aria-hidden="true">
			<Icon icon="chevron-right" small label="" />
		</span>
	</button>
	{#if open}
		<div class="tlui-submenu__panel tlui-submenu__panel--{side}" role="menu">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.tlui-submenu {
		position: relative;
	}
	.tlui-submenu__trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-height: 32px;
		padding: 0 8px;
		border: none;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		font: 500 13px/1 var(--tl-font-sans);
		text-align: left;
		cursor: pointer;
	}
	.tlui-submenu__trigger:hover {
		background: var(--tl-color-hover, #f0f0f0);
	}
	.tlui-submenu__label {
		flex: 1 1 auto;
	}
	.tlui-submenu__chevron {
		margin-left: auto;
		opacity: 0.6;
	}
	/* The nested flyout: opens to one side of the row; scrolls if long. */
	.tlui-submenu__panel {
		position: absolute;
		top: -4px;
		z-index: var(--tl-layer-menus, 400);
		min-width: 180px;
		max-height: 60vh;
		overflow-y: auto;
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
	}
	.tlui-submenu__panel--right {
		left: 100%;
		margin-left: 2px;
	}
	.tlui-submenu__panel--left {
		right: 100%;
		margin-right: 2px;
	}
</style>
