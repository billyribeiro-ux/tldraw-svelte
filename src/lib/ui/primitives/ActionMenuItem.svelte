<script lang="ts">
	import { getActions } from '$lib/ui/context';
	import MenuItem from './MenuItem.svelte';

	// From-scratch action-bound menu item (port of tldraw's TldrawUiMenuActionItem).
	// Looks the action up in the registry by id and renders/wires it. For checkbox
	// actions, pass `checked` (a reactive boolean read by the parent from the editor).
	let {
		actionId,
		source = 'menu',
		checked
	}: { actionId: string; source?: string; checked?: boolean } = $props();

	const actions = getActions();
	const action = $derived(actions[actionId]);
</script>

{#if action}
	<MenuItem
		label={action.label}
		icon={action.icon}
		kbd={action.kbd}
		checked={action.checkbox ? (checked ?? false) : undefined}
		onSelect={() => action.onSelect(source)}
	/>
{/if}
