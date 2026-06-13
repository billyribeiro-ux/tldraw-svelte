<script lang="ts">
	// From-scratch keyboard-shortcut display (no third-party lib). Mirrors tldraw's
	// TldrawUiKbd: splits a `kbd` string like "cmd+s" / "$z" into keycap symbols.
	let { kbd }: { kbd: string } = $props();

	const isMac =
		typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');

	// tldraw kbd shorthand: $ = cmd/ctrl, ! = shift, ? = alt.
	function expand(k: string): string[] {
		const out: string[] = [];
		for (const ch of k) {
			if (ch === '$') out.push(isMac ? '⌘' : 'Ctrl');
			else if (ch === '!') out.push(isMac ? '⇧' : 'Shift');
			else if (ch === '?') out.push(isMac ? '⌥' : 'Alt');
			else out.push(ch.toUpperCase());
		}
		return out;
	}

	// A kbd may carry several comma-separated variants (e.g. "$=,=", "d,b,x"); show
	// only the FIRST, like tldraw's hint display.
	const keys = $derived.by(() => {
		const first = (kbd.split(',')[0] ?? '').trim();
		return first.includes('+') ? first.split('+').map((s) => s.trim()) : expand(first);
	});
</script>

<kbd class="tlui-kbd">
	<!-- Key by index, not value: a kbd like "=" or "-" can repeat the same glyph
	     (e.g. accel+= and bare =), which would throw each_key_duplicate. -->
	{#each keys as key, i (i)}
		<span class="tlui-kbd__key">{key}</span>
	{/each}
</kbd>

<style>
	.tlui-kbd {
		display: inline-flex;
		gap: 2px;
		font: 500 11px/1 var(--tl-font-sans);
		/* Push the keycaps off the preceding label (tldraw ui.css:598-627). */
		margin-inline-start: var(--tl-space-4, 12px);
	}
	.tlui-kbd__key {
		min-width: 1em;
		text-align: center;
		/* Keycap chrome: small padding + rounded corners (tldraw ui.css:612-619). */
		padding: 2px;
		border-radius: 2px;
	}
</style>
