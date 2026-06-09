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
	/* The fill layer (hover / active) — an inset rounded rectangle. */
	.tlui-button::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		z-index: -1;
	}
	.tlui-button:hover:not(:disabled)::after {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.tlui-button--active,
	.tlui-button[data-isactive='true'] {
		color: var(--tl-color-selected-contrast, #fff);
	}
	.tlui-button--active::after,
	.tlui-button[data-isactive='true']::after {
		background: var(--tl-color-selected, #4465e9);
	}
	.tlui-button--primary {
		color: var(--tl-color-selected-contrast, #fff);
	}
	.tlui-button--primary::after {
		background: var(--tl-color-primary, #4465e9);
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
	.tlui-button--menu {
		justify-content: flex-start;
		width: 100%;
	}
</style>
