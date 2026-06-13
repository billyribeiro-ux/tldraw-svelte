<script lang="ts">
	import { getToasts } from '$lib/ui/context';
	import Icon from '../Icon.svelte';

	// Cosmetic tldraw.com share chrome (top-right): a share-icon button + a blue
	// "Sign in to share" button. Visual-only look-alikes — there is no accounts /
	// sharing backend in this port, so they raise an informational toast rather than
	// opening a real share flow (this matches dotcom's placement, not its function).
	const toasts = getToasts();

	function notImplemented(what: string) {
		toasts.add({
			title: what,
			description: 'Sharing requires a Dev Draw account — not available in this build.',
			severity: 'info'
		});
	}
</script>

<div class="tlui-share-chrome">
	<button
		class="tlui-share-chrome__icon"
		type="button"
		title="Share"
		aria-label="Share"
		data-testid="share-button"
		onclick={() => notImplemented('Share')}
	>
		<Icon icon="share-1" small label="Share" />
	</button>
	<button
		class="tlui-share-chrome__signin"
		type="button"
		data-testid="sign-in-button"
		onclick={() => notImplemented('Sign in to share')}
	>
		Sign in to share
	</button>
</div>

<style>
	.tlui-share-chrome {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.tlui-share-chrome__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		color: var(--tl-color-text, #1d1d1d);
		cursor: pointer;
	}
	.tlui-share-chrome__icon:hover {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-share-chrome__signin {
		height: 40px;
		padding: 0 16px;
		border: none;
		border-radius: var(--tl-radius-3, 9px);
		background: var(--tl-color-primary, #4465e9);
		color: #fff;
		font: 600 13px/1 var(--tl-font-sans, system-ui, sans-serif);
		cursor: pointer;
		box-shadow: var(--tl-shadow-2);
	}
	.tlui-share-chrome__signin:hover {
		filter: brightness(1.08);
	}
</style>
