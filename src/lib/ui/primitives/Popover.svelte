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

	// Viewport-aware positioning: anchor with CSS, but on open measure the trigger,
	// the content's natural height and the available space, then (a) flip to the side
	// with more room when the preferred side would overflow, and (b) clamp max-height
	// to that space with scroll — so a tall menu near a screen edge is never cut off.
	function positionContent(node: HTMLElement) {
		const MARGIN = 8;
		const GAP = 6;
		const reposition = () => {
			if (!anchorEl) return;
			const a = anchorEl.getBoundingClientRect();
			const vh = window.innerHeight;
			const spaceBelow = vh - a.bottom - GAP - MARGIN;
			const spaceAbove = a.top - GAP - MARGIN;
			const natural = node.scrollHeight;

			let effective = side;
			if (side === 'bottom' && natural > spaceBelow && spaceAbove > spaceBelow) effective = 'top';
			else if (side === 'top' && natural > spaceAbove && spaceBelow > spaceAbove)
				effective = 'bottom';

			const space = effective === 'bottom' ? spaceBelow : spaceAbove;
			node.classList.toggle('tlui-popover__content--top', effective === 'top');
			node.classList.toggle('tlui-popover__content--bottom', effective === 'bottom');
			// Only clamp + scroll when the content genuinely doesn't fit. Otherwise keep
			// overflow visible so nested submenu flyouts aren't clipped.
			if (natural > space) {
				node.style.maxHeight = `${Math.max(120, space)}px`;
				node.style.overflowY = 'auto';
			} else {
				node.style.maxHeight = '';
				node.style.overflowY = '';
			}

			// Horizontal guard: nudge back on-screen if an edge overflows, preserving
			// the centering transform for align="center".
			const base = align === 'center' ? 'translateX(-50%)' : '';
			node.style.transform = base;
			const r = node.getBoundingClientRect();
			let dx = 0;
			if (r.right > window.innerWidth - MARGIN) dx = window.innerWidth - MARGIN - r.right;
			else if (r.left < MARGIN) dx = MARGIN - r.left;
			node.style.transform = dx ? `${base} translateX(${dx}px)`.trim() : base;
		};

		reposition();
		const ro = new ResizeObserver(reposition);
		ro.observe(node);
		window.addEventListener('resize', reposition);
		window.addEventListener('scroll', reposition, true);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', reposition);
			window.removeEventListener('scroll', reposition, true);
		};
	}
</script>

<svelte:document onpointerdown={ondocpointerdown} {onkeydown} />

<div class="tlui-popover" bind:this={anchorEl}>
	{@render trigger({ open, toggle, props: triggerProps })}
	{#if open}
		<div
			class="tlui-popover__content tlui-popover__content--{side} tlui-popover__content--{align}"
			role="menu"
			tabindex="-1"
			{@attach positionContent}
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
