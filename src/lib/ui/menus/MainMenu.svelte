<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import MenuGroup from '../primitives/MenuGroup.svelte';
	import ActionMenuItem from '../primitives/ActionMenuItem.svelte';
	import Submenu from '../primitives/Submenu.svelte';
	import Icon from '../Icon.svelte';
	import LanguageMenu from './LanguageMenu.svelte';

	// From-scratch MainMenu (port of tldraw's MainMenu) — a hamburger dropdown of
	// action-bound groups: edit (undo/redo/cut-clipboard-ish), arrange, view.
	// Each row is an ActionMenuItem bound to the actions registry by id, so the
	// real editor operation + keyboard hint come from one source of truth.
	const editor = getEditor();

	// Live checkbox state for the preference toggles, read reactively from the editor.
	const isGrid = fromComputed('grid mode', () => editor.getInstanceState().isGridMode);
	const isDark = fromComputed('dark mode', () => editor.user.getIsDarkMode());
	const isToolLocked = fromComputed('tool locked', () => editor.getInstanceState().isToolLocked);
	const isSnap = fromComputed('snap mode', () => editor.user.getIsSnapMode());
	const isDebug = fromComputed('debug mode', () => editor.getInstanceState().isDebugMode);
</script>

<Popover side="bottom" align="start">
	{#snippet trigger({ toggle, props })}
		<Button
			type="icon"
			title="Menu"
			ariaLabel="Menu"
			onclick={toggle}
			{...props}
			data-testid="main-menu.button"
		>
			<Icon icon="menu" label="Menu" />
		</Button>
	{/snippet}

	<MenuGroup>
		<ActionMenuItem actionId="undo" />
		<ActionMenuItem actionId="redo" />
	</MenuGroup>

	<MenuGroup>
		<ActionMenuItem actionId="cut" />
		<ActionMenuItem actionId="copy" />
		<ActionMenuItem actionId="paste" />
	</MenuGroup>

	<MenuGroup>
		<ActionMenuItem actionId="duplicate" />
		<ActionMenuItem actionId="delete" />
		<ActionMenuItem actionId="select-all" />
	</MenuGroup>

	<MenuGroup>
		<ActionMenuItem actionId="group" />
		<ActionMenuItem actionId="ungroup" />
	</MenuGroup>

	<!-- Reorder: matches tldraw's ReorderMenuSubmenu set (all four registry actions). -->
	<MenuGroup>
		<ActionMenuItem actionId="bring-to-front" />
		<ActionMenuItem actionId="bring-forward" />
		<ActionMenuItem actionId="send-backward" />
		<ActionMenuItem actionId="send-to-back" />
	</MenuGroup>

	<!-- Arrange: align / distribute / stretch / stack / rotate / flip, grouped into a
	     submenu (the existing Submenu primitive, as used by LanguageMenu) to keep the
	     top-level menu short. Every row maps to an action that exists in the registry. -->
	<MenuGroup>
		<Submenu label="Arrange" side="right">
			<MenuGroup>
				<ActionMenuItem actionId="align-left" />
				<ActionMenuItem actionId="align-center-horizontal" />
				<ActionMenuItem actionId="align-right" />
				<ActionMenuItem actionId="align-top" />
				<ActionMenuItem actionId="align-center-vertical" />
				<ActionMenuItem actionId="align-bottom" />
			</MenuGroup>
			<MenuGroup>
				<ActionMenuItem actionId="distribute-horizontal" />
				<ActionMenuItem actionId="distribute-vertical" />
				<ActionMenuItem actionId="stretch-horizontal" />
				<ActionMenuItem actionId="stretch-vertical" />
				<ActionMenuItem actionId="stack-horizontal" />
				<ActionMenuItem actionId="stack-vertical" />
			</MenuGroup>
			<MenuGroup>
				<ActionMenuItem actionId="rotate-cw" />
				<ActionMenuItem actionId="rotate-ccw" />
				<ActionMenuItem actionId="flip-horizontal" />
				<ActionMenuItem actionId="flip-vertical" />
			</MenuGroup>
		</Submenu>
	</MenuGroup>

	<!-- View -->
	<MenuGroup>
		<ActionMenuItem actionId="zoom-in" />
		<ActionMenuItem actionId="zoom-out" />
		<ActionMenuItem actionId="zoom-to-100" />
		<ActionMenuItem actionId="zoom-to-fit" />
		<ActionMenuItem actionId="zoom-to-selection" />
	</MenuGroup>

	<!-- Preferences -->
	<MenuGroup>
		<ActionMenuItem actionId="toggle-snap-mode" checked={isSnap.current} />
		<ActionMenuItem actionId="toggle-tool-lock" checked={isToolLocked.current} />
		<ActionMenuItem actionId="toggle-grid" checked={isGrid.current} />
		<ActionMenuItem actionId="toggle-dark-mode" checked={isDark.current} />
		<ActionMenuItem actionId="toggle-debug-mode" checked={isDebug.current} />
		<LanguageMenu side="right" />
	</MenuGroup>

	<!-- Export -->
	<MenuGroup>
		<ActionMenuItem actionId="export-as-svg" />
		<ActionMenuItem actionId="export-as-png" />
	</MenuGroup>
</Popover>
