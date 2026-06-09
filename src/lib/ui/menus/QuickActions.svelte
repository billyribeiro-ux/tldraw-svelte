<script lang="ts">
	import { getEditor, getActions } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Icon from '../Icon.svelte';

	// From-scratch QuickActions (port of tldraw's DefaultQuickActionsContent): the
	// undo / redo / delete / duplicate icon buttons in the top-left menu zone, with
	// the same reactive disabled conditions (undo→canUndo, redo→canRedo, delete &
	// duplicate→a shape is selected in the select tool).
	const editor = getEditor();
	const actions = getActions();

	const canUndo = fromComputed('can undo', () => editor.getCanUndo());
	const canRedo = fromComputed('can redo', () => editor.getCanRedo());
	const hasSelection = fromComputed('has selection', () => editor.getSelectedShapeIds().length > 0);

	const items = $derived([
		{ id: 'undo', disabled: !canUndo.current },
		{ id: 'redo', disabled: !canRedo.current },
		{ id: 'delete', disabled: !hasSelection.current },
		{ id: 'duplicate', disabled: !hasSelection.current }
	]);
</script>

<div class="tlui-quick-actions" role="group" aria-label="Quick actions">
	{#each items as item (item.id)}
		{@const action = actions[item.id]}
		{#if action}
			<Button
				type="icon"
				title={action.label}
				ariaLabel={action.label}
				disabled={item.disabled}
				onclick={() => action.onSelect('quick-actions')}
				data-action={item.id}
			>
				<Icon icon={action.icon ?? item.id} small label={action.label} />
			</Button>
		{/if}
	{/each}
</div>

<style>
	.tlui-quick-actions {
		display: flex;
		align-items: center;
		gap: 0;
	}
	/* Quick-action buttons are the compact 32px size, like tldraw's small icons. */
	.tlui-quick-actions :global(.tlui-button) {
		height: 40px;
		width: 32px;
		min-width: 32px;
	}
	.tlui-quick-actions :global(.tlui-button .tlui-icon) {
		width: 15px;
		height: 15px;
	}
</style>
