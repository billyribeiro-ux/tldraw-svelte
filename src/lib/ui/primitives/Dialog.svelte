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
		background: rgba(0, 0, 0, 0.3);
	}
	.tlui-dialog__panel {
		min-width: 320px;
		max-width: min(90vw, 560px);
		max-height: 85vh;
		overflow: auto;
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-4, 11px);
		box-shadow: var(--tl-shadow-3);
		outline: none;
	}
	.tlui-dialog__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
	.tlui-dialog__title {
		margin: 0;
		font:
			600 15px/1.2 var(--tl-font-sans);
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
		padding: 16px;
	}
</style>
