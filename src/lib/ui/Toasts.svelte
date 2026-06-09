<script lang="ts">
	import { getToasts } from '$lib/ui/context';

	// From-scratch toast viewport (port of tldraw's Toasts, no Radix). Renders the
	// reactive toast stack bottom-center-right; each toast is dismissible and
	// auto-removes via the store's timer. Severity drives the accent color.
	const store = getToasts();
</script>

<div class="tlui-toasts" role="region" aria-label="Notifications" data-testid="toasts">
	{#each store.toasts as toast (toast.id)}
		<div
			class="tlui-toast tlui-toast--{toast.severity ?? 'info'}"
			role="status"
			aria-live="polite"
			data-testid="toast"
		>
			<div class="tlui-toast__text">
				<span class="tlui-toast__title">{toast.title}</span>
				{#if toast.description}
					<span class="tlui-toast__description">{toast.description}</span>
				{/if}
			</div>
			<button
				class="tlui-toast__close"
				type="button"
				aria-label="Dismiss notification"
				onclick={() => store.remove(toast.id)}
			>
				✕
			</button>
		</div>
	{/each}
</div>

<style>
	.tlui-toasts {
		position: absolute;
		right: var(--tl-space-3, 8px);
		bottom: 72px;
		display: flex;
		flex-direction: column;
		gap: var(--tl-space-3, 8px);
		pointer-events: none;
		z-index: var(--tl-layer-toasts, 650);
	}
	.tlui-toast {
		display: flex;
		align-items: flex-start;
		gap: var(--tl-space-4, 12px);
		min-width: 220px;
		max-width: 320px;
		padding: 10px 12px;
		border-left: 3px solid var(--tl-color-primary, #4465e9);
		border-radius: var(--tl-radius-3, 9px);
		background: var(--tl-color-panel, #fff);
		box-shadow: var(--tl-shadow-3);
		pointer-events: all;
	}
	.tlui-toast--success {
		border-left-color: #2f9e44;
	}
	.tlui-toast--warning {
		border-left-color: #f08c00;
	}
	.tlui-toast--error {
		border-left-color: var(--tl-color-danger, #e03131);
	}
	.tlui-toast__text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1 1 auto;
	}
	.tlui-toast__title {
		font:
			600 13px/1.2 var(--tl-font-sans);
		color: var(--tl-color-text, #1d1d1d);
	}
	.tlui-toast__description {
		font:
			500 12px/1.3 var(--tl-font-sans);
		color: var(--tl-color-text-secondary, #6b6b6b);
	}
	.tlui-toast__close {
		border: none;
		background: transparent;
		font-size: 12px;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 5px;
		color: var(--tl-color-text-secondary, #6b6b6b);
	}
	.tlui-toast__close:hover {
		background: var(--tl-color-hover, #f0f0f0);
	}
</style>
