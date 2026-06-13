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
		sideOffset = 0,
		trigger,
		children
	}: {
		open?: boolean;
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
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

			// ---- Horizontal sides ('left'/'right') ----------------------------------
			// Flyout placed to the side of the trigger (used by the style-panel dropdown
			// pickers, which open to the LEFT of the 148px panel). `sideOffset` pushes the
			// flyout further from the trigger (tldraw's Radix `sideOffset`). `align` picks
			// the vertical anchoring: center against the trigger, or align top/bottom edges.
			if (side === 'left' || side === 'right') {
				const a = anchorEl.getBoundingClientRect();
				const vw = window.innerWidth;
				const width = node.offsetWidth;
				const spaceLeft = a.left - GAP - MARGIN - sideOffset;
				const spaceRight = vw - a.right - GAP - MARGIN - sideOffset;

				let effectiveH = side;
				if (side === 'left' && width > spaceLeft && spaceRight > spaceLeft) effectiveH = 'right';
				else if (side === 'right' && width > spaceRight && spaceLeft > spaceRight)
					effectiveH = 'left';

				node.classList.toggle('tlui-popover__content--left', effectiveH === 'left');
				node.classList.toggle('tlui-popover__content--right', effectiveH === 'right');
				// Clear any vertical-side classes so a re-anchored flyout starts clean.
				node.classList.remove('tlui-popover__content--top', 'tlui-popover__content--bottom');

				// Horizontal offset from the trigger (CSS sets the base 100% + 6px gap; the
				// extra sideOffset is applied via transform so it composes with the flip).
				const tx =
					effectiveH === 'left' ? `translateX(-${sideOffset}px)` : `translateX(${sideOffset}px)`;

				// Vertical alignment + viewport guard. align="center" centres the flyout
				// against the trigger; "start"/"end" line up the top/bottom edges (the CSS
				// classes own the base alignment, we only nudge for centering + overflow).
				const baseY = align === 'center' ? 'translateY(-50%)' : '';
				node.style.transform = `${tx} ${baseY}`.trim();
				const vh = window.innerHeight;
				const r = node.getBoundingClientRect();
				let dy = 0;
				if (r.bottom > vh - MARGIN) dy = vh - MARGIN - r.bottom;
				else if (r.top < MARGIN) dy = MARGIN - r.top;
				node.style.transform = `${tx} ${baseY} ${dy ? `translateY(${dy}px)` : ''}`.trim();

				// Clamp height to the viewport if the flyout is taller than the screen.
				const natural = node.scrollHeight;
				const vspace = vh - 2 * MARGIN;
				if (natural > vspace) {
					node.style.maxHeight = `${Math.max(120, vspace)}px`;
					node.style.overflowY = 'auto';
				} else {
					node.style.maxHeight = '';
					node.style.overflowY = '';
				}
				return;
			}

			// ---- Vertical sides ('top'/'bottom') — unchanged ------------------------
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

	/* ---- Horizontal sides ('left'/'right') ----------------------------------
	   The flyout sits to the side of the trigger. These compound selectors win on
	   specificity over the generic align rules above, so the same --start/--center/
	   --end tokens drive VERTICAL anchoring here (top/center/bottom) instead of the
	   horizontal anchoring they drive for top/bottom sides. The JS `positionContent`
	   layers the sideOffset + viewport nudge on top via `transform`. */
	.tlui-popover__content--left {
		right: calc(100% + 6px);
		left: auto;
	}
	.tlui-popover__content--right {
		left: calc(100% + 6px);
		right: auto;
	}
	.tlui-popover__content--left.tlui-popover__content--start,
	.tlui-popover__content--right.tlui-popover__content--start {
		top: 0;
		bottom: auto;
	}
	.tlui-popover__content--left.tlui-popover__content--center,
	.tlui-popover__content--right.tlui-popover__content--center {
		top: 50%;
		bottom: auto;
		/* JS overwrites transform with translateY(-50%) (+ offsets); this is the
		   no-JS fallback so the flyout is still vertically centred. */
		transform: translateY(-50%);
	}
	.tlui-popover__content--left.tlui-popover__content--end,
	.tlui-popover__content--right.tlui-popover__content--end {
		bottom: 0;
		top: auto;
	}
</style>
