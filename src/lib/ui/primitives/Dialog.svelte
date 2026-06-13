<script lang="ts">
	import type { Snippet } from 'svelte';

	// From-scratch modal dialog (no third-party UI lib). Overlay + centered panel,
	// Escape + backdrop-click to close, focus moved into the panel on open and
	// restored on close. Mirrors tldraw's TldrawUiDialog usage.
	let {
		open = $bindable(true),
		title,
		onClose,
		children
	}: {
		open?: boolean;
		title?: string;
		onClose?: () => void;
		children: Snippet;
	} = $props();

	let lastFocused: HTMLElement | null = null;

	function close() {
		open = false;
		onClose?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			close();
		}
	}

	function focusPanel(node: HTMLElement) {
		lastFocused = document.activeElement as HTMLElement | null;
		// Children mount before the parent's attachment runs, so the body content
		// is present. Prefer the first focusable in the BODY (a real field) over
		// the header's close button; fall back to the panel itself.
		const scope = node.querySelector<HTMLElement>('.tlui-dialog__body') ?? node;
		const focusable = scope.querySelector<HTMLElement>(
			'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
		);
		(focusable ?? node).focus();
		return () => lastFocused?.focus?.();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<!-- Backdrop: click to dismiss. role/handlers keep it accessible. -->
	<div
		class="tlui-dialog__overlay"
		role="presentation"
		onpointerdown={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<div
			class="tlui-dialog__panel"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			{@attach focusPanel}
		>
			{#if title}
				<header class="tlui-dialog__header">
					<h2 class="tlui-dialog__title">{title}</h2>
					<button class="tlui-dialog__close" type="button" aria-label="Close" onclick={close}>
						✕
					</button>
				</header>
			{/if}
			<div class="tlui-dialog__body">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.tlui-dialog__overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		/* tldraw ui.css:1685-1699 uses the --tl-color-overlay token. */
		background: var(--tl-color-overlay, hsl(0, 0%, 0%, 20%));
	}
	.tlui-dialog__panel {
		min-width: 320px;
		max-width: min(90vw, 560px);
		max-height: 85vh;
		overflow: auto;
		background: var(--tl-color-panel, #fff);
		/* tldraw dialog content uses radius-3, not radius-4 (ui.css:1708). */
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
		outline: none;
	}
	.tlui-dialog__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		/* Fixed 40px header (tldraw ui.css:1716-1725). */
		height: 40px;
		padding: 0 16px;
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
	.tlui-dialog__title {
		margin: 0;
		/* 12px, inherited weight — not 15px/600 (tldraw ui.css:1727-1733). */
		font-family: var(--tl-font-sans);
		font-size: 12px;
		font-weight: inherit;
	}
	.tlui-dialog__close {
		border: none;
		background: transparent;
		font-size: 14px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
	}
	.tlui-dialog__close:hover {
		background: var(--tl-color-hover, #f0f0f0);
	}
	.tlui-dialog__body {
		/* tldraw ui.css:1739-1740: padding is the --tl-space-4 token. */
		padding: var(--tl-space-4, 12px);
	}
</style>
