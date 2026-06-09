<script lang="ts">
	import type { Snippet } from 'svelte';

	// From-scratch menu group (no third-party lib): a labelled cluster of menu
	// items separated from siblings by a divider. Mirrors tldraw's
	// TldrawUiMenuGroup.
	let { children }: { children: Snippet } = $props();
</script>

<div class="tlui-menu-group" role="group">
	{@render children()}
</div>

<style>
	.tlui-menu-group {
		display: flex;
		flex-direction: column;
		padding: 2px 0;
	}
	.tlui-menu-group:not(:last-child) {
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
</style>
