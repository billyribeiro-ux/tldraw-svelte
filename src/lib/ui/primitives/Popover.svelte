<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setPopoverClose } from './popover-context.svelte';

	// From-scratch popover (no third-party UI lib). A trigger button + floating
	// content anchored to it, with click-outside + Escape to close and basic focus
	// management. Used as the base for dropdown menus, the style panel, etc.
	let {
		open = $bindable(false),
		side = 'bottom',
		align = 'start',
		trigger,
		children
	}: {
		open?: boolean;
		side?: 'top' | 'bottom';
		align?: 'start' | 'center' | 'end';
		trigger: Snippet<[{ open: boolean; toggle: () => void; props: Record<string, unknown> }]>;
		children: Snippet;
	} = $props();

	let anchorEl = $state<HTMLElement | undefined>(undefined);

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	// Let descendant menu items close this popover after they activate.
	setPopoverClose(close);

	// Close on outside click / Escape while open.
	function ondocpointerdown(e: PointerEvent) {
		if (!open) return;
		const target = e.target as Node;
		if (anchorEl && !anchorEl.contains(target)) close();
	}
	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			close();
			e.stopPropagation();
		}
	}

	const triggerProps = $derived({
		'aria-haspopup': 'menu' as const,
		'aria-expanded': open
	});
</script>

<svelte:document onpointerdown={ondocpointerdown} {onkeydown} />

<div class="tlui-popover" bind:this={anchorEl}>
	{@render trigger({ open, toggle, props: triggerProps })}
	{#if open}
		<div
			class="tlui-popover__content tlui-popover__content--{side} tlui-popover__content--{align}"
			role="menu"
			tabindex="-1"
		>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.tlui-popover {
		position: relative;
		display: inline-flex;
	}
	.tlui-popover__content {
		position: absolute;
		z-index: var(--tl-layer-menus, 400);
		min-width: 160px;
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
	}
	.tlui-popover__content--bottom {
		top: calc(100% + 6px);
	}
	.tlui-popover__content--top {
		bottom: calc(100% + 6px);
	}
	.tlui-popover__content--start {
		left: 0;
	}
	.tlui-popover__content--center {
		left: 50%;
		transform: translateX(-50%);
	}
	.tlui-popover__content--end {
		right: 0;
	}
</style>
