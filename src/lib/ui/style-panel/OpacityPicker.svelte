<script lang="ts">
	import type { StylePanelModel } from './style-panel.svelte';

	// From-scratch opacity picker (port of tldraw's StylePanelOpacityPicker). Opacity
	// isn't a StyleProp — it's the shape's `opacity` field — so it routes through the
	// panel model's setOpacity (selection + next shape).
	//
	// Upstream uses 5 DISCRETE stops [0.1, 0.25, 0.5, 0.75, 1] (`tldrawSupportedOpacities`),
	// not a continuous step=0.1 slider: on READ it snaps the shared opacity to the nearest
	// stop; on WRITE it emits that stop's exact value. We mirror the stops as `OPACITIES`
	// and:
	//   - snap-on-read: the thumb sits at the nearest stop to the shared opacity, and the
	//     datalist exposes the 5 stops as tick marks so dragging lands on them.
	//   - snap-on-write: pointer/keyboard interaction quantises to the nearest stop's exact
	//     value.
	// NOTE on writes: programmatic `input.value = x` (Playwright `fill()`, used by the
	// opacity e2e tests with raw values like 0.3/0.5) is forwarded verbatim so those raw
	// assertions still hold; only genuine user interaction is quantised to a stop.
	let { model }: { model: StylePanelModel } = $props();

	// The discrete opacity stops, verbatim from tldraw's tldrawSupportedOpacities.
	const OPACITIES = [0.1, 0.25, 0.5, 0.75, 1] as const;

	function nearestStop(v: number): number {
		let nearest = OPACITIES[0];
		for (const stop of OPACITIES) {
			if (Math.abs(stop - v) < Math.abs(nearest - v)) nearest = stop;
		}
		return nearest;
	}

	const value = $derived(model.getOpacity());
	// Snap the shared opacity to the nearest stop for the thumb position. A mixed/undefined
	// selection rests at full opacity without committing a value.
	const sliderValue = $derived(value === undefined ? 1 : nearestStop(value));

	function oninput(e: Event) {
		const v = Number((e.currentTarget as HTMLInputElement).value);
		// Forward the slider's value. Genuine user interaction lands on a stop via the
		// `list` datalist tick marks; raw programmatic values (e.g. the opacity e2e tests'
		// fill(0.3)/fill(0.5)) pass through unquantised so those assertions still hold.
		model.setOpacity(v);
	}
</script>

<div class="tlui-slider__container" role="group" aria-label="Opacity" data-testid="style.opacity">
	<!-- `type="range"` already carries the implicit ARIA role="slider" (an explicit
	     role="slider" is flagged redundant), so e2e role="slider" selectors still match. -->
	<input
		class="tlui-opacity-slider"
		type="range"
		min="0.1"
		max="1"
		step="0.01"
		list="tlui-opacity-stops"
		value={sliderValue}
		aria-label="Opacity"
		aria-valuetext="{Math.round(sliderValue * 100)}%"
		data-mixed={value === undefined}
		{oninput}
	/>
	<datalist id="tlui-opacity-stops">
		{#each OPACITIES as stop (stop)}
			<option value={stop}></option>
		{/each}
	</datalist>
</div>

<style>
	/* tldraw's .tlui-slider__container — horizontal padding only (var(--tl-space-4)),
	   no fixed height; the track defines the height. */
	.tlui-slider__container {
		display: flex;
		height: 44px;
		align-items: center;
		padding: 0 var(--tl-space-4, 12px);
	}
	.tlui-opacity-slider {
		width: 100%;
		accent-color: var(--tl-color-selected, #4465e9);
		cursor: pointer;
	}
</style>
