<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import MenuGroup from '../primitives/MenuGroup.svelte';
	import ActionMenuItem from '../primitives/ActionMenuItem.svelte';
	import { setPopoverClose } from '../primitives/popover-context.svelte';

	// From-scratch ContextMenu (port of tldraw's ContextMenu). Right-clicking the
	// canvas opens an action menu at the pointer. The action set depends on whether
	// shapes are selected (selection ops vs. canvas ops), mirroring tldraw's
	// hasSelectedShapes branching. Items are ActionMenuItems bound to the registry.
	const editor = getEditor();

	const selectedCount = fromComputed('selected count', () => editor.getSelectedShapeIds().length);
	const hasSelection = $derived(selectedCount.current > 0);
	const canGroup = $derived(selectedCount.current > 1);

	let open = $state(false);
	let x = $state(0);
	let y = $state(0);

	function oncontextmenu(e: MouseEvent) {
		// Only hijack right-clicks that land on the canvas surface, not on UI chrome.
		const target = e.target as HTMLElement;
		if (target.closest('.tlui-layout')) return; // a UI element handled it
		if (!target.closest('.tl-container, .tl-canvas')) return;
		e.preventDefault();
		x = e.clientX;
		y = e.clientY;
		open = true;
	}

	function close() {
		open = false;
	}

	// Let descendant menu items close this menu after they activate (the same
	// channel Popover uses), so we don't need a click handler on the container.
	setPopoverClose(close);

	function onpointerdown(e: PointerEvent) {
		if (!open) return;
		const target = e.target as HTMLElement;
		if (!target.closest('.tlui-context-menu')) close();
	}

	function onkeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			close();
			e.stopPropagation();
		}
	}
</script>

<svelte:document {oncontextmenu} {onpointerdown} {onkeydown} />

{#if open}
	<!-- Activating any item runs its onSelect, then closes this menu via the
	     setPopoverClose channel (MenuItem calls it). Outside clicks close too. -->
	<div
		class="tlui-context-menu"
		role="menu"
		tabindex="-1"
		style:left="{x}px"
		style:top="{y}px"
		data-testid="context-menu"
	>
		{#if hasSelection}
			<MenuGroup>
				<ActionMenuItem actionId="cut" source="context-menu" />
				<ActionMenuItem actionId="copy" source="context-menu" />
				<ActionMenuItem actionId="paste" source="context-menu" />
			</MenuGroup>
			<MenuGroup>
				<ActionMenuItem actionId="duplicate" source="context-menu" />
				<ActionMenuItem actionId="delete" source="context-menu" />
			</MenuGroup>
			<MenuGroup>
				{#if canGroup}
					<ActionMenuItem actionId="group" source="context-menu" />
				{/if}
				<ActionMenuItem actionId="ungroup" source="context-menu" />
				<ActionMenuItem actionId="bring-to-front" source="context-menu" />
				<ActionMenuItem actionId="send-to-back" source="context-menu" />
				<ActionMenuItem actionId="flip-horizontal" source="context-menu" />
				<ActionMenuItem actionId="flip-vertical" source="context-menu" />
			</MenuGroup>
		{:else}
			<MenuGroup>
				<ActionMenuItem actionId="select-all" source="context-menu" />
			</MenuGroup>
			<MenuGroup>
				<ActionMenuItem actionId="zoom-to-fit" source="context-menu" />
				<ActionMenuItem actionId="reset-zoom" source="context-menu" />
			</MenuGroup>
		{/if}
	</div>
{/if}

<style>
	.tlui-context-menu {
		position: fixed;
		z-index: var(--tl-layer-menus, 400);
		min-width: 180px;
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
		pointer-events: all;
	}
</style>
