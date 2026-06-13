<script lang="ts">
	import type { Snippet } from 'svelte';

	// From-scratch port of tldraw's TldrawUiButton (no third-party UI lib).
	// Mirrors its prop surface: 8 type variants, isActive, disabled, tooltip.
	type ButtonType = 'normal' | 'primary' | 'danger' | 'low' | 'icon' | 'tool' | 'menu' | 'help';

	let {
		type = 'normal',
		isActive = false,
		disabled = false,
		title,
		ariaLabel,
		htmlType = 'button',
		onclick,
		children,
		...rest
	}: {
		type?: ButtonType;
		isActive?: boolean;
		disabled?: boolean;
		title?: string;
		ariaLabel?: string;
		htmlType?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<button
	class="tlui-button tlui-button--{type}"
	class:tlui-button--active={isActive}
	type={htmlType}
	{disabled}
	{title}
	aria-label={ariaLabel ?? title}
	aria-pressed={isActive}
	data-isactive={isActive}
	{onclick}
	{...rest}
>
	{@render children?.()}
</button>

<style>
	/* Ported 1:1 from tldraw's .tlui-button (ui.css): 40px base, 12px font, the
	   text-1 color token, and the inset ::after used for hover/active fills so the
	   highlight is a rounded inset rectangle exactly like the original. */
	.tlui-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		height: 40px;
		min-width: 40px;
		padding: 0 12px;
		border: none;
		background: transparent;
		color: var(--tl-color-text-1, #2d2d2d);
		font-family: var(--tl-font-sans, system-ui, sans-serif);
		font-size: 12px;
		font-weight: inherit;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		z-index: 0;
	}
	/* The fill layer (hover / active). Ported 1:1 from tldraw's ui.css: the
	   background is ALWAYS --tl-color-muted-2 and OPACITY is toggled (0 → 1). Active
	   swaps the background to --tl-color-hint. Because hover changes opacity and
	   active changes background, hover never overrides the active highlight (this is
	   what kept tldraw's selected buttons from greying out on hover). */
	.tlui-button::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
		opacity: 0;
		z-index: -1;
	}
	.tlui-button:hover:not(:disabled)::after {
		opacity: 1;
	}
	.tlui-button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	/* Base active = subtle hint (tldraw: .tlui-button[data-isactive]::after { hint }).
	   The icon keeps its default colour; only TOOL buttons go blue + white (below). */
	.tlui-button--active::after,
	.tlui-button[data-isactive='true']::after {
		background: var(--tl-color-hint, hsl(0, 0%, 0%, 5.5%));
		opacity: 1;
	}
	.tlui-button--primary {
		color: var(--tl-color-selected-contrast, #fff);
	}
	.tlui-button--primary::after {
		background: var(--tl-color-primary, #4465e9);
		opacity: 1;
	}
	.tlui-button--danger {
		color: var(--tl-color-danger, #e03131);
	}
	/* Tool buttons are square 48×48 with an 8px-radius inset fill (tldraw spec). */
	.tlui-button--icon,
	.tlui-button--tool {
		padding: 0;
		width: 48px;
		height: 48px;
	}
	.tlui-button--tool::after {
		border-radius: 8px;
	}
	/* Active TOOL = strong selected blue + white icon (tldraw:
	   .tlui-button__tool[aria-pressed='true']). Overrides the base hint above. */
	.tlui-button--tool.tlui-button--active,
	.tlui-button--tool[data-isactive='true'] {
		color: var(--tl-color-selected-contrast, #fff);
	}
	.tlui-button--tool.tlui-button--active::after,
	.tlui-button--tool[data-isactive='true']::after {
		background: var(--tl-color-selected, hsl(214, 84%, 56%));
		opacity: 1;
	}
	/* Menu rows: full-width left-aligned with an 8px icon/label gap. The -4px
	   margin-top collapses the 4px inset gap between stacked rows (tldraw
	   ui.css:187-210); the first row resets it so the group's top edge is flush. */
	.tlui-button--menu {
		justify-content: flex-start;
		width: 100%;
		gap: 8px;
		margin-top: -4px;
	}
	.tlui-button--menu:first-child {
		margin-top: 0;
	}
</style>
