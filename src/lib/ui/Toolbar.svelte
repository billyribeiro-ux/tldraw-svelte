<script lang="ts">
	import {
		getEditor,
		getTools,
		TOOLBAR_ORDER,
		getBreakpointState,
		BREAKPOINT
	} from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Button from './primitives/Button.svelte';
	import Popover from './primitives/Popover.svelte';
	import Icon from './Icon.svelte';
	import QuickActions from './menus/QuickActions.svelte';
	import ActionsMenu from './menus/ActionsMenu.svelte';

	// tldraw shows the quick-actions + actions-menu in the BOTTOM toolbar (as a
	// controls pill above the tools) when below the TABLET breakpoint, and in the
	// top-left menu panel at/above it. (DefaultToolbar vs DefaultMenuPanel.)
	const bp = getBreakpointState();
	const showExtrasControls = $derived(bp.value < BREAKPOINT.TABLET);

	// From-scratch toolbar matching tldraw's OverflowingToolbar: a flat row of tool
	// buttons in tldraw's exact order (select, hand, draw, eraser, arrow, text, note,
	// every geo variant, line, highlight, frame). When they don't all fit, the extras
	// move into a "..." overflow popover — tldraw's behaviour, computed from the
	// available width via ResizeObserver. No third-party lib.
	const editor = getEditor();
	const tools = getTools();

	const currentToolId = fromComputed('current tool', () => editor.getCurrentToolId());
	const activeToolId = $derived(currentToolId.current);

	// Tool-lock toggle (tldraw's ToggleToolLockedButton): shown only for lockable
	// shape tools (geo/draw/arrow/line/text/note/frame/highlight — not select/hand/
	// eraser), toggling editor.isToolLocked with a lock/unlock icon.
	const LOCKABLE = new Set(['geo', 'draw', 'arrow', 'line', 'text', 'note', 'frame', 'highlight']);
	const isToolLocked = fromComputed('tool locked', () => editor.getInstanceState().isToolLocked);
	const showLock = $derived(LOCKABLE.has(activeToolId));
	function toggleLock() {
		editor.updateInstanceState({ isToolLocked: !editor.getInstanceState().isToolLocked });
	}

	// All tools in tldraw's toolbar order (skip any id not in the registry).
	const allTools = $derived(
		TOOLBAR_ORDER.map((id) => tools[id]).filter((t): t is NonNullable<typeof t> => Boolean(t))
	);

	// A tool is active either by id (simple tools) or — for geo variants — when the
	// geo tool is current AND its variant is the next-shape geo style.
	function isActive(tool: NonNullable<(typeof allTools)[number]>): boolean {
		// activeToolId read makes this reactive; the predicate reads the geo signal.
		void activeToolId;
		return tool.isActive();
	}

	// --- Overflow: tldraw's OverflowingToolbar caps the visible row by mapping the
	// available width through modulate([310,470] → [4,8]) and clamping to [4,8]. So at
	// any desktop width the main row shows at most 8 tools and the rest go in the "…"
	// popover — exactly matching tldraw (not "as many as fit").
	const MIN_ITEMS = 4;
	const MAX_ITEMS = 8;
	const MIN_PX = 310;
	const MAX_PX = 470;
	// Width available to the toolbar = viewport minus the reserved corner zones
	// (matches .tlui-toolbar max-width: calc(100vw - 480px)). Measured on the layout
	// region, NOT the shrink-wrapped inner row (which would feedback-loop on itself).
	const SIDE_RESERVE = 480;
	let available = $state(MAX_PX);

	function measure(node: HTMLElement) {
		// Observe the document element so the toolbar reflows with the window.
		const compute = () => {
			const vw = node.ownerDocument.documentElement.clientWidth;
			available = Math.max(MIN_PX, vw - SIDE_RESERVE);
		};
		const ro = new ResizeObserver(compute);
		ro.observe(node.ownerDocument.documentElement);
		compute();
		return () => ro.disconnect();
	}

	// modulate(value, [inLo,inHi], [outLo,outHi]) clamped, then floored — tldraw's math.
	const visibleCount = $derived.by(() => {
		const t = Math.max(0, Math.min(1, (available - MIN_PX) / (MAX_PX - MIN_PX)));
		const itemsToShow = Math.floor(MIN_ITEMS + t * (MAX_ITEMS - MIN_ITEMS));
		// If everything already fits in the cap, show all (no overflow button).
		if (allTools.length <= itemsToShow) return allTools.length;
		return Math.max(MIN_ITEMS, itemsToShow);
	});

	const visibleTools = $derived(allTools.slice(0, visibleCount));
	const overflowTools = $derived(allTools.slice(visibleCount));
</script>

<div class="tlui-toolbar" role="toolbar" aria-label="Tools">
	<!-- Extras controls pill ABOVE the tools (tldraw .tlui-main-toolbar__extras):
	     quick-actions + actions-menu (only below TABLET) and the tool-lock toggle. -->
	{#if showExtrasControls || showLock}
		<div class="tlui-toolbar__extras">
			{#if showExtrasControls}
				<div class="tlui-toolbar__extras__controls" role="group" aria-label="Quick actions">
					<QuickActions />
					<ActionsMenu />
				</div>
			{/if}
			{#if showLock}
				<Button
					type="tool"
					isActive={isToolLocked.current}
					title="Tool lock"
					ariaLabel="Tool lock"
					onclick={toggleLock}
					data-testid="toolbar.tool-lock"
				>
					<Icon icon={isToolLocked.current ? 'lock' : 'unlock'} label="Tool lock" />
				</Button>
			{/if}
		</div>
	{/if}

	<div class="tlui-toolbar__tools">
		<!-- The measured/clipped row of visible tools. overflow:hidden here is why the
		     overflow popover must live OUTSIDE this element (else it'd be clipped). -->
		<div class="tlui-toolbar__inner" {@attach measure}>
			{#each visibleTools as tool (tool.id)}
				<Button
					type="tool"
					isActive={isActive(tool)}
					title={tool.label}
					ariaLabel={tool.label}
					onclick={() => tool.onSelect('toolbar')}
					data-tool={tool.id}
				>
					<Icon icon={tool.icon} label={tool.label} />
				</Button>
			{/each}
		</div>

		{#if overflowTools.length > 0}
			<Popover side="top" align="end">
				{#snippet trigger({ toggle, props })}
					<Button
						type="tool"
						title="More tools"
						ariaLabel="More tools"
						isActive={overflowTools.some((t) => isActive(t))}
						onclick={toggle}
						data-testid="toolbar.more"
						{...props}
					>
						<Icon icon="chevron-up" label="More tools" />
					</Button>
				{/snippet}
				<div class="tlui-toolbar__overflow" data-testid="toolbar.overflow-grid">
					{#each overflowTools as tool (tool.id)}
						<Button
							type="tool"
							isActive={isActive(tool)}
							title={tool.label}
							ariaLabel={tool.label}
							onclick={() => tool.onSelect('toolbar')}
							data-tool={tool.id}
						>
							<Icon icon={tool.icon} label={tool.label} />
						</Button>
					{/each}
				</div>
			</Popover>
		{/if}
	</div>
</div>

<style>
	/* The toolbar is a centered column: the extras pill sits ABOVE the tools pill,
	   matching tldraw's .tlui-main-toolbar__inner with __extras on top of __tools. */
	.tlui-toolbar {
		position: absolute;
		bottom: 0;
		left: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translateX(-50%);
		margin-bottom: var(--tl-space-3, 8px);
		z-index: var(--tl-layer-panels, 300);
	}
	/* The tools pill — the rounded white bar of tool buttons. */
	.tlui-toolbar__tools {
		display: flex;
		align-items: center;
		/* Leave room for the corner zones (navigation bottom-left, helpers) so the
		   centered toolbar never overlaps them; beyond this the tools overflow. */
		max-width: calc(100vw - 480px);
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-panel, #fff);
		border-radius: var(--tl-radius-4, 11px);
		box-shadow: var(--tl-shadow-2);
	}
	/* Extras row (quick actions + lock), left-aligned above the tools (tldraw). */
	.tlui-toolbar__extras {
		display: flex;
		align-self: flex-start;
		align-items: flex-end;
		margin-left: 8px;
	}
	/* The quick-actions controls pill: a low-contrast group with rounded TOP corners
	   that connects to the tools pill below (tldraw .tlui-main-toolbar__extras__controls). */
	.tlui-toolbar__extras__controls {
		display: flex;
		align-items: center;
		padding: var(--tl-space-1, 2px);
		background: var(--tl-color-low, var(--tl-color-muted-2, rgba(0, 0, 0, 0.043)));
		border: 2px solid var(--tl-color-background, #f9fafb);
		border-bottom: none;
		border-top-left-radius: var(--tl-radius-4, 11px);
		border-top-right-radius: var(--tl-radius-4, 11px);
	}
	.tlui-toolbar__inner {
		display: flex;
		align-items: center;
		gap: 0;
		overflow: hidden;
	}
	.tlui-toolbar__overflow {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
	}
</style>
