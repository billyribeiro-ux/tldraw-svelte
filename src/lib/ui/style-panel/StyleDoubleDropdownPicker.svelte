<script lang="ts" generics="T extends string">
	import type { StyleProp } from '@tldraw/editor';
	import type { StylePanelModel } from './style-panel.svelte';
	import Popover from '../primitives/Popover.svelte';
	import Icon from '../Icon.svelte';

	// Faithful port of tldraw's StylePanelDoubleDropdownPicker (arrowheads row): a single
	// labelled row with TWO icon-only dropdown triggers side by side (start + end). Each
	// opens a 4-column grid flying out to the LEFT of the 148px panel (side="left"
	// align="center"), at increasing sideOffsets so neither overlaps the panel. The start
	// trigger's icon is mirrored (invertIcon) like upstream. Item testids stay
	// `style.<uiTypeA>.<value>` / `style.<uiTypeB>.<value>`; triggers are
	// `style.<uiTypeA>` / `style.<uiTypeB>`.
	interface Option {
		value: T;
		label: string;
		icon: string;
	}

	let {
		model,
		label,
		uiTypeA,
		styleA,
		itemsA,
		labelA,
		uiTypeB,
		styleB,
		itemsB,
		labelB
	}: {
		model: StylePanelModel;
		label: string;
		uiTypeA: string;
		styleA: StyleProp<T>;
		itemsA: Option[];
		labelA: string;
		uiTypeB: string;
		styleB: StyleProp<T>;
		itemsB: Option[];
		labelB: string;
	} = $props();

	let openA = $state(false);
	let openB = $state(false);

	const currentA = $derived(model.getValue(styleA));
	const currentB = $derived(model.getValue(styleB));
	const optionA = $derived(itemsA.find((o) => o.value === currentA));
	const optionB = $derived(itemsB.find((o) => o.value === currentB));
	// Upstream falls back to the 'mixed' glyph when the value isn't shared; we use it when
	// the value is mixed/absent so the trigger still shows something meaningful.
	const iconA = $derived(optionA?.icon ?? 'mixed');
	const iconB = $derived(optionB?.icon ?? 'mixed');

	function chooseA(value: T) {
		model.setStyle(styleA, value);
		openA = false;
	}
	function chooseB(value: T) {
		model.setStyle(styleB, value);
		openB = false;
	}
</script>

<div class="tlui-style-panel__double-select-picker">
	<div title={label} class="tlui-style-panel__double-select-picker-label">{label}</div>
	<div class="tlui-style-panel__double-select-picker-toolbar">
		<!-- Start arrowhead. sideOffset 80 keeps the grid clear of the 148px panel; the
		     trigger icon is mirrored (invertIcon) to read as a "start" arrowhead. -->
		<Popover bind:open={openA} side="left" align="center" sideOffset={80}>
			{#snippet trigger({ toggle, props })}
				<button
					class="tlui-style-icon-btn"
					type="button"
					title="{labelA} — {optionA?.label ?? 'Mixed'}"
					aria-label="{labelA} — {optionA?.label ?? 'Mixed'}"
					data-testid="style.{uiTypeA}"
					data-value={currentA}
					onclick={toggle}
					{...props}
				>
					<Icon icon={iconA} small invertIcon label="" />
				</button>
			{/snippet}
			<div
				class="tlui-style-dropdown__grid"
				role="radiogroup"
				aria-label={labelA}
				data-testid="style.{uiTypeA}.menu"
			>
				{#each itemsA as opt (opt.value)}
					<button
						class="tlui-style-icon-btn"
						class:tlui-style-icon-btn--active={currentA === opt.value}
						type="button"
						role="radio"
						aria-checked={currentA === opt.value}
						data-testid="style.{uiTypeA}.{opt.value}"
						data-value={opt.value}
						title="{labelA} — {opt.label}"
						aria-label="{labelA} — {opt.label}"
						onclick={() => chooseA(opt.value)}
					>
						<Icon icon={opt.icon} invertIcon label="" />
					</button>
				{/each}
			</div>
		</Popover>
		<!-- End arrowhead. sideOffset 116 pushes its grid further left than the start one. -->
		<Popover bind:open={openB} side="left" align="center" sideOffset={116}>
			{#snippet trigger({ toggle, props })}
				<button
					class="tlui-style-icon-btn"
					type="button"
					title="{labelB} — {optionB?.label ?? 'Mixed'}"
					aria-label="{labelB} — {optionB?.label ?? 'Mixed'}"
					data-testid="style.{uiTypeB}"
					data-value={currentB}
					onclick={toggle}
					{...props}
				>
					<Icon icon={iconB} small label="" />
				</button>
			{/snippet}
			<div
				class="tlui-style-dropdown__grid"
				role="radiogroup"
				aria-label={labelB}
				data-testid="style.{uiTypeB}.menu"
			>
				{#each itemsB as opt (opt.value)}
					<button
						class="tlui-style-icon-btn"
						class:tlui-style-icon-btn--active={currentB === opt.value}
						type="button"
						role="radio"
						aria-checked={currentB === opt.value}
						data-testid="style.{uiTypeB}.{opt.value}"
						data-value={opt.value}
						title="{labelB} — {opt.label}"
						aria-label="{labelB} — {opt.label}"
						onclick={() => chooseB(opt.value)}
					>
						<Icon icon={opt.icon} label="" />
					</button>
				{/each}
			</div>
		</Popover>
	</div>
</div>

<style>
	/* tldraw ui.css .tlui-style-panel__double-select-picker: a label on the left and the
	   two dropdown triggers on the right, padded to align with the panel's left inset. */
	.tlui-style-panel__double-select-picker {
		display: flex;
		align-items: center;
		padding-left: var(--tl-space-4, 12px);
		color: var(--tl-color-text-1, #2d2d2d);
		font-size: 12px;
	}
	.tlui-style-panel__double-select-picker-label {
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		flex-grow: 2;
		max-width: 100%;
	}
	.tlui-style-panel__double-select-picker-toolbar {
		display: flex;
		flex: 0 0 auto;
	}
	/* The flyout grid — a compact 4-column grid of icon buttons (orientation="grid"). */
	.tlui-style-dropdown__grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
	}
	.tlui-style-icon-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--tl-color-text-1, #2d2d2d);
		cursor: pointer;
		z-index: 0;
	}
	.tlui-style-icon-btn::after {
		content: '';
		position: absolute;
		inset: 4px;
		border-radius: var(--tl-radius-2, 6px);
		background: transparent;
		z-index: -1;
	}
	.tlui-style-icon-btn:hover::after {
		background: var(--tl-color-muted-2, rgba(0, 0, 0, 0.043));
	}
	.tlui-style-icon-btn--active::after,
	.tlui-style-icon-btn--active:hover::after {
		background: var(--tl-color-hint, hsl(0, 0%, 0%, 5.5%));
	}
</style>
