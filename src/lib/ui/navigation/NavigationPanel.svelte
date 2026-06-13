<script lang="ts">
	import { getActions, getBreakpointState, BREAKPOINT } from '$lib/ui/context';
	import Button from '../primitives/Button.svelte';
	import Icon from '../Icon.svelte';
	import ZoomMenu from '../menus/ZoomMenu.svelte';
	import Minimap from './Minimap.svelte';

	// From-scratch NavigationPanel — a 1:1 port of tldraw's DefaultNavigationPanel:
	//  - the whole panel is hidden below the MOBILE breakpoint;
	//  - below TABLET it shows ONLY the ZoomMenu;
	//  - at TABLET+ it shows zoom-out / ZoomMenu / zoom-in / minimap-toggle;
	//  - the Minimap renders ONLY at TABLET+ AND when not collapsed;
	//  - `collapsed` defaults to TRUE and persists to localStorage('minimap'), so the
	//    minimap is hidden on first load — exactly like tldraw.
	const actions = getActions();
	const bp = getBreakpointState();

	// Persisted collapse state (tldraw uses useLocalStorageState('minimap', true)).
	const STORAGE_KEY = 'minimap';
	function readCollapsed(): boolean {
		if (typeof localStorage === 'undefined') return true;
		const v = localStorage.getItem(STORAGE_KEY);
		return v === null ? true : v === 'true';
	}
	let collapsed = $state(readCollapsed());

	function toggleMinimap() {
		collapsed = !collapsed;
		if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, String(collapsed));
	}

	const hidden = $derived(bp.value < BREAKPOINT.MOBILE);
	const compact = $derived(bp.value < BREAKPOINT.TABLET);
	const showMinimap = $derived(bp.value >= BREAKPOINT.TABLET && !collapsed);
</script>

{#if !hidden}
	<div class="tlui-navigation-panel" data-testid="navigation-panel">
		<div class="tlui-navigation-panel__controls" role="toolbar" aria-label="Navigation">
			{#if compact}
				<ZoomMenu />
			{:else}
				{#if !collapsed}
					<Button
						type="icon"
						title="Zoom out"
						ariaLabel="Zoom out"
						onclick={() => actions['zoom-out']?.onSelect('navigation-zone')}
						data-testid="nav.zoom-out"
					>
						<Icon icon="zoom-out" small label="Zoom out" />
					</Button>
				{/if}
				<ZoomMenu />
				{#if !collapsed}
					<Button
						type="icon"
						title="Zoom in"
						ariaLabel="Zoom in"
						onclick={() => actions['zoom-in']?.onSelect('navigation-zone')}
						data-testid="nav.zoom-in"
					>
						<Icon icon="zoom-in" small label="Zoom in" />
					</Button>
				{/if}
				<Button
					type="icon"
					title="Toggle minimap"
					ariaLabel="Toggle minimap"
					onclick={toggleMinimap}
					data-testid="minimap.toggle-button"
				>
					<Icon icon={collapsed ? 'chevron-right' : 'chevron-left'} small label="Toggle minimap" />
				</Button>
			{/if}
		</div>
		{#if showMinimap}
			<Minimap />
		{/if}
	</div>
{/if}

<style>
	/* Connected bottom-left corner block (tldraw ui.css .tlui-navigation-panel +
	   ::before): low-contrast bg with a 2px background-colored top/right border and a
	   single top-right radius — the mirror of the top-left menu zone. */
	.tlui-navigation-panel {
		position: relative;
		display: flex;
		flex-direction: column-reverse;
		width: min-content;
		gap: var(--tl-space-1, 2px);
		padding: var(--tl-space-1, 2px);
	}
	.tlui-navigation-panel::before {
		content: '';
		display: block;
		position: absolute;
		z-index: -1;
		inset: -2px -2px 0 0;
		border-top: 2px solid var(--tl-color-background, #f9fafb);
		border-right: 2px solid var(--tl-color-background, #f9fafb);
		border-top-right-radius: var(--tl-radius-4, 11px);
		background-color: var(--tl-color-low, #eceef0);
	}
	.tlui-navigation-panel__controls {
		display: flex;
		align-items: center;
		gap: 2px;
	}
</style>
