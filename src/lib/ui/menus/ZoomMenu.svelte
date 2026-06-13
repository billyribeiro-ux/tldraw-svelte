<script lang="ts">
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import MenuGroup from '../primitives/MenuGroup.svelte';
	import ActionMenuItem from '../primitives/ActionMenuItem.svelte';

	// From-scratch ZoomMenu (port of tldraw's ZoomMenu). The trigger shows the live
	// zoom percentage; the dropdown offers the real zoom actions from the registry.
	const editor = getEditor();
	const zoom = fromComputed('zoom level', () => editor.getZoomLevel());
	const zoomPct = $derived(`${Math.round(zoom.current * 100)}%`);
</script>

<Popover side="top" align="start">
	{#snippet trigger({ toggle, props })}
		<Button
			type="menu"
			title="Zoom"
			ariaLabel="Zoom menu"
			onclick={toggle}
			{...props}
			data-testid="zoom-menu.button"
		>
			<span class="tlui-zoom-menu__value">{zoomPct}</span>
		</Button>
	{/snippet}

	<MenuGroup>
		<ActionMenuItem actionId="zoom-in" />
		<ActionMenuItem actionId="zoom-out" />
		<ActionMenuItem actionId="zoom-to-100" />
		<ActionMenuItem actionId="zoom-to-fit" />
		<ActionMenuItem actionId="zoom-to-selection" />
	</MenuGroup>
</Popover>

<style>
	/* Ported from tldraw ui.css (.tlui-zoom-menu__button): a fixed 60px-wide
	   trigger so the live percentage label has a stable width. Targets the
	   trigger by its testid to avoid clobbering Button's own class list. */
	:global(button[data-testid='zoom-menu.button']) {
		width: 60px;
		min-width: 60px;
		text-align: center;
	}
	.tlui-zoom-menu__value {
		min-width: 40px;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
