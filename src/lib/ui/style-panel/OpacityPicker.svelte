<script lang="ts">
	import type { StylePanelModel } from './style-panel.svelte';

	// From-scratch opacity picker (port of tldraw's OpacitySlider). Opacity isn't a
	// StyleProp — it's the shape's `opacity` field — so it routes through the panel
	// model's setOpacity (selection + next shape). The slider reflects the shared
	// opacity; a mixed selection shows the slider at its midpoint without a value.
	let { model }: { model: StylePanelModel } = $props();

	const value = $derived(model.getOpacity());
	// tldraw uses 6 discrete steps (0.1 … 1). We mirror that granularity.
	const sliderValue = $derived(value ?? 1);

	function oninput(e: Event) {
		const v = Number((e.currentTarget as HTMLInputElement).value);
		model.setOpacity(v);
	}
</script>

<div class="tlui-slider__container" role="group" aria-label="Opacity" data-testid="style.opacity">
	<input
		class="tlui-opacity-slider"
		type="range"
		min="0.1"
		max="1"
		step="0.1"
		value={sliderValue}
		aria-label="Opacity"
		data-mixed={value === undefined}
		{oninput}
	/>
</div>

<style>
	/* tldraw's .tlui-slider__container — the slider stands alone, no heading text. */
	.tlui-slider__container {
		display: flex;
		height: 32px;
		align-items: center;
		padding: 0 8px;
	}
	.tlui-opacity-slider {
		width: 100%;
		accent-color: var(--tl-color-selected, #4465e9);
		cursor: pointer;
	}
</style>
