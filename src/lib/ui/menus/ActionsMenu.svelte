<script lang="ts">
	import { getEditor, getActions } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import Icon from '../Icon.svelte';

	// From-scratch ActionsMenu (port of tldraw's DefaultActionsMenuContent): a "…"
	// button opening a grid popover of align / distribute / stack / reorder / rotate
	// / group actions. Each group's items are disabled by the same rules tldraw uses
	// (align needs 2+ shapes, distribute/stack need 3+, reorder/rotate/ungroup need
	// 1+, group needs 2+). Items are bound to the actions registry by id.
	const editor = getEditor();
	const actions = getActions();

	const count = fromComputed('selected count', () => editor.getSelectedShapeIds().length);
	const n = $derived(count.current);

	// Disabled predicates per tldraw's rules.
	const need1 = $derived(n < 1);
	const need2 = $derived(n < 2);
	const need3 = $derived(n < 3);

	// Grid groups, in tldraw's order. `dis` is the reactive disabled flag.
	const groups = $derived([
		[
			{ id: 'align-left', dis: need2 },
			{ id: 'align-center-horizontal', dis: need2 },
			{ id: 'align-right', dis: need2 },
			{ id: 'stretch-horizontal', dis: need2 },
			{ id: 'align-top', dis: need2 },
			{ id: 'align-center-vertical', dis: need2 },
			{ id: 'align-bottom', dis: need2 },
			{ id: 'stretch-vertical', dis: need2 }
		],
		[
			{ id: 'distribute-horizontal', dis: need3 },
			{ id: 'distribute-vertical', dis: need3 },
			{ id: 'stack-horizontal', dis: need3 },
			{ id: 'stack-vertical', dis: need3 }
		],
		[
			{ id: 'send-to-back', dis: need1 },
			{ id: 'send-backward', dis: need1 },
			{ id: 'bring-forward', dis: need1 },
			{ id: 'bring-to-front', dis: need1 }
		],
		[
			{ id: 'rotate-ccw', dis: need1 },
			{ id: 'rotate-cw', dis: need1 },
			{ id: 'group', dis: need2 },
			{ id: 'ungroup', dis: need1 }
		]
	]);
</script>

<Popover side="bottom" align="end">
	{#snippet trigger({ toggle, props })}
		<Button
			type="icon"
			title="More actions"
			ariaLabel="More actions"
			onclick={toggle}
			{...props}
			data-testid="actions-menu.button"
		>
			<Icon icon="dots-vertical" label="More actions" />
		</Button>
	{/snippet}

	<div class="tlui-actions-menu" data-testid="actions-menu">
		{#each groups as group, gi (gi)}
			<div class="tlui-actions-menu__group">
				{#each group as item (item.id)}
					{@const action = actions[item.id]}
					{#if action}
						<button
							class="tlui-actions-menu__btn"
							type="button"
							title={action.label}
							aria-label={action.label}
							disabled={item.dis}
							data-action={item.id}
							onclick={() => action.onSelect('actions-menu')}
						>
							<Icon icon={action.icon ?? item.id} small label={action.label} />
						</button>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</Popover>

<style>
	.tlui-actions-menu {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.tlui-actions-menu__group {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
		padding: var(--tl-space-1, 2px) 0;
	}
	.tlui-actions-menu__group:not(:last-child) {
		border-bottom: 1px solid var(--tl-color-divider, #e8e8e8);
	}
	.tlui-actions-menu__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		color: var(--tl-color-text-1, #2d2d2d);
		cursor: pointer;
	}
	.tlui-actions-menu__btn:hover:not(:disabled) {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-actions-menu__btn:disabled {
		opacity: 0.35;
		cursor: default;
	}
</style>
