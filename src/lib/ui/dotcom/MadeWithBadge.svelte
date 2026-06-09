<script lang="ts">
	// Cosmetic "Made with tldraw" badge (bottom-right), matching tldraw.com. Links to
	// tldraw.dev. Visual-only dotcom chrome.
</script>

<a
	class="tlui-made-with"
	href="https://tldraw.dev"
	target="_blank"
	rel="noopener noreferrer"
	data-testid="made-with-tldraw"
	aria-label="Made with tldraw"
>
	<span class="tlui-made-with__pre">MADE WITH</span>
	<span class="tlui-made-with__mark" aria-hidden="true">
		<svg viewBox="0 0 20 20" width="12" height="12" fill="none">
			<path
				d="M5 3h6a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H8v6"
				stroke="white"
				stroke-width="2.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</span>
	<span class="tlui-made-with__word">TLDRAW</span>
</a>

<style>
	.tlui-made-with {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 32px;
		padding: 0 10px;
		text-decoration: none;
		color: var(--tl-color-text, #1d1d1d);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-2, 6px);
		box-shadow: var(--tl-shadow-2);
		font: 700 11px/1 var(--tl-font-sans, system-ui, sans-serif);
		letter-spacing: 0.02em;
	}
	.tlui-made-with__pre {
		color: var(--tl-color-text-3, #6b6b6b);
	}
	.tlui-made-with__mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		background: #1d1d1d;
	}
</style>
