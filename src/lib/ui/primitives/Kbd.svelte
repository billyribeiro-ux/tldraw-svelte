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

	const keys = $derived(
		kbd.includes('+') ? kbd.split('+').map((s) => s.trim()) : expand(kbd)
	);
</script>

<kbd class="tlui-kbd">
	{#each keys as key (key)}
		<span class="tlui-kbd__key">{key}</span>
	{/each}
</kbd>

<style>
	.tlui-kbd {
		display: inline-flex;
		gap: 2px;
		font:
			500 11px/1 var(--tl-font-sans);
	}
	.tlui-kbd__key {
		min-width: 1em;
		text-align: center;
	}
</style>
