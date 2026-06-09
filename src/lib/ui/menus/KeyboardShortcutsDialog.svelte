<script lang="ts">
	import { getActions, getTools } from '$lib/ui/context';
	import Dialog from '../primitives/Dialog.svelte';
	import Kbd from '../primitives/Kbd.svelte';

	// From-scratch KeyboardShortcutsDialog (port of tldraw's). Lists the real
	// keyboard shortcuts straight from the tools + actions registries (single source
	// of truth — the same kbd strings the from-scratch Keybindings binder parses),
	// so the dialog can never drift from what actually fires. Controlled via
	// `bind:open` so the HelpMenu can open it (matching tldraw's HelpMenu → shortcuts).
	let { open = $bindable(false) }: { open?: boolean } = $props();

	const actions = getActions();
	const tools = getTools();

	const toolRows = $derived(Object.values(tools).filter((t) => t.kbd));
	const actionRows = $derived(Object.values(actions).filter((a) => a.kbd));
</script>

{#if open}
	<Dialog title="Keyboard shortcuts" onClose={() => (open = false)}>
		<div class="tlui-shortcuts" data-testid="shortcuts.dialog">
			<section class="tlui-shortcuts__group">
				<h3 class="tlui-shortcuts__heading">Tools</h3>
				{#each toolRows as tool (tool.id)}
					<div class="tlui-shortcuts__row">
						<span class="tlui-shortcuts__label">{tool.label}</span>
						<Kbd kbd={tool.kbd ?? ''} />
					</div>
				{/each}
			</section>

			<section class="tlui-shortcuts__group">
				<h3 class="tlui-shortcuts__heading">Actions</h3>
				{#each actionRows as action (action.id)}
					<div class="tlui-shortcuts__row">
						<span class="tlui-shortcuts__label">{action.label}</span>
						<Kbd kbd={action.kbd ?? ''} />
					</div>
				{/each}
			</section>
		</div>
	</Dialog>
{/if}

<style>
	.tlui-shortcuts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}
	.tlui-shortcuts__heading {
		margin: 0 0 8px;
		font:
			600 12px/1 var(--tl-font-sans);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--tl-color-text-secondary, #6b6b6b);
	}
	.tlui-shortcuts__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 30px;
		font:
			500 13px/1 var(--tl-font-sans);
	}
	.tlui-shortcuts__label {
		color: var(--tl-color-text, #1d1d1d);
	}
</style>
