<script lang="ts">
	import { getEditor } from '$lib/state-svelte';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import {
		setActions,
		createDefaultActions,
		setTools,
		createDefaultTools,
		setToasts,
		ToastStore,
		setA11y,
		A11yAnnouncer,
		setBreakpoint,
		BreakpointState,
		BREAKPOINT,
		getBreakpoint
	} from '$lib/ui/context';
	import Keybindings from './Keybindings.svelte';
	import Toolbar from './Toolbar.svelte';
	import MainMenu from './menus/MainMenu.svelte';
	import PageMenu from './menus/PageMenu.svelte';
	import QuickActions from './menus/QuickActions.svelte';
	import ActionsMenu from './menus/ActionsMenu.svelte';
	import ContextMenu from './menus/ContextMenu.svelte';
	import HelpMenu from './menus/HelpMenu.svelte';
	import StylePanel from './style-panel/StylePanel.svelte';
	import MobileStylePanel from './style-panel/MobileStylePanel.svelte';
	import NavigationPanel from './navigation/NavigationPanel.svelte';
	import Toasts from './Toasts.svelte';
	import A11y from './A11y.svelte';
	import DebugPanel from './DebugPanel.svelte';
	import Logo from './dotcom/Logo.svelte';
	import ShareChrome from './dotcom/ShareChrome.svelte';
	import MadeWithBadge from './dotcom/MadeWithBadge.svelte';

	// From-scratch UI composition root — the port of tldraw's TldrawUi. Builds the
	// actions + tools registries from the editor, sets them as context (so menus,
	// the toolbar, and the keyboard-shortcut binder can consume them), and lays
	// out the UI regions. Rendered INSIDE TldrawEditor (editor context available).
	// Regions: Keybindings + ContextMenu + Toolbar, top-left MenuPanel (MainMenu +
	// PageMenu), bottom-left NavigationPanel (Minimap + zoom controls) with the
	// shortcuts button, top-right StylePanel, plus the Toasts viewport and the a11y
	// live region. Remaining: SVG export + parity sweep (Phase G).
	const editor = getEditor();

	// From-scratch toast + a11y contexts (no Radix). Available to all UI children.
	const toasts = new ToastStore();
	const a11y = new A11yAnnouncer();
	setToasts(toasts);
	setA11y(a11y);

	const tools = createDefaultTools(editor);
	setActions(createDefaultActions(editor, toasts));
	setTools(tools);

	// Reactive breakpoint (tldraw's responsive UI). Fed by the layout's width via a
	// ResizeObserver; components branch on it. Below TABLET_SM the style panel
	// collapses to the mobile swatch button in the toolbar area.
	const breakpoint = new BreakpointState();
	setBreakpoint(breakpoint);
	const isMobile = $derived(breakpoint.value < BREAKPOINT.TABLET_SM);
	// tldraw: quick-actions live in the top-left menu panel only at/above TABLET;
	// below that they move into the bottom toolbar (handled in Toolbar.svelte).
	const showQuickActionsInMenu = $derived(breakpoint.value >= BREAKPOINT.TABLET);

	// When debug mode is on, a thin readout strip sits at the very bottom; lift the
	// floating toolbar so the two don't overlap.
	const isDebug = fromComputed('debug mode', () => editor.getInstanceState().isDebugMode);

	function observeWidth(node: HTMLElement) {
		const ro = new ResizeObserver(() => {
			breakpoint.value = getBreakpoint(node.clientWidth);
		});
		ro.observe(node);
		breakpoint.value = getBreakpoint(node.clientWidth);
		return () => ro.disconnect();
	}

	// Announce tool changes to the live region — a real a11y win the original UI
	// also provides. Reading the reactive tool id inside $effect tracks changes.
	const currentToolId = fromComputed('current tool', () => editor.getCurrentToolId());
	$effect(() => {
		const id = currentToolId.current;
		const label = tools[id]?.label ?? id;
		a11y.announce(`${label} tool`, 'polite');
	});
</script>

<div class="tlui-layout" {@attach observeWidth}>
	<Keybindings />
	<ContextMenu />

	<!-- Top-left: the tldraw.com logo, then the MenuPanel (menu + page + quick actions). -->
	<div class="tlui-layout__top-left">
		<div class="tlui-panel tlui-layout__logo-panel">
			<Logo />
		</div>
		<div class="tlui-panel">
			<MainMenu />
			<PageMenu />
			{#if showQuickActionsInMenu}
				<QuickActions />
				<ActionsMenu />
			{/if}
		</div>
	</div>

	<!-- Bottom-left: the navigation panel (minimap + zoom controls). -->
	<div class="tlui-layout__bottom-left">
		<NavigationPanel />
	</div>

	<!-- Top-right: cosmetic tldraw.com share chrome (share + sign-in). -->
	<div class="tlui-layout__top-right-chrome">
		<ShareChrome />
	</div>

	<!-- Bottom-right: the 'Made with tldraw' badge + the help menu. -->
	<div class="tlui-layout__bottom-right">
		<MadeWithBadge />
		<div class="tlui-panel">
			<HelpMenu />
		</div>
	</div>

	<!-- Top-right: the desktop style panel (tablet+). On mobile it collapses to a
	     swatch button beside the toolbar (below). -->
	{#if !isMobile}
		<div class="tlui-layout__top-right">
			<StylePanel />
		</div>
	{/if}

	<div class="tlui-layout__bottom" class:tlui-layout__bottom--debug={isDebug.current}>
		<Toolbar />
		{#if isMobile}
			<div class="tlui-layout__mobile-style tlui-panel">
				<MobileStylePanel />
			</div>
		{/if}
	</div>

	<DebugPanel />
	<Toasts />
	<A11y />
</div>

<style>
	.tlui-layout {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 200;
	}
	/* Children opt back into pointer events on their own elements. */
	.tlui-layout :global(button),
	.tlui-layout :global(a),
	.tlui-layout :global(.tlui-toolbar),
	.tlui-layout :global(.tlui-popover),
	.tlui-layout :global(.tlui-panel),
	.tlui-layout :global(.tlui-navigation-panel) {
		pointer-events: all;
	}
	.tlui-panel {
		position: absolute;
		display: flex;
		gap: var(--tl-space-1, 2px);
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-3, 9px);
		box-shadow: var(--tl-shadow-3);
	}
	/* Top-left: logo panel + menu panel in a row (dotcom layout). */
	.tlui-layout__top-left {
		position: absolute;
		top: 8px;
		left: 8px;
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.tlui-layout__top-left .tlui-panel {
		position: static;
	}
	.tlui-layout__logo-panel {
		align-items: center;
	}
	.tlui-layout__bottom-left {
		position: absolute;
		bottom: 8px;
		left: 8px;
	}
	/* Bottom-right: the made-with badge + help panel, aligned to the bottom edge. */
	.tlui-layout__bottom-right {
		position: absolute;
		bottom: 8px;
		right: 8px;
		display: flex;
		align-items: flex-end;
		gap: 8px;
		pointer-events: all;
	}
	.tlui-layout__bottom-right .tlui-panel {
		position: static;
	}
	/* The style panel sits below the share chrome on the right. */
	.tlui-layout__top-right {
		position: absolute;
		top: 56px;
		right: 8px;
		pointer-events: all;
	}
	/* Top-right share chrome (cosmetic dotcom). */
	.tlui-layout__top-right-chrome {
		position: absolute;
		top: 8px;
		right: 8px;
		pointer-events: all;
	}
	/* Mobile: the style swatch button sits at the bottom-right, by the toolbar. */
	.tlui-layout__mobile-style {
		position: absolute;
		bottom: 8px;
		right: 8px;
		padding: 0;
	}
	/* In debug mode the bottom readout strip occupies the very bottom edge; lift the
	   floating toolbar above it so they don't overlap. */
	.tlui-layout__bottom--debug :global(.tlui-toolbar) {
		margin-bottom: 28px;
	}
</style>
