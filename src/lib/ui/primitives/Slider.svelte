<script lang="ts">
	// From-scratch slider (no third-party lib). Built on a native range input for
	// free a11y + keyboard support; styled to match tldraw. Mirrors the
	// TldrawUiSlider surface: value (0..steps), onValueChange, onHistoryMark.
	let {
		value,
		steps,
		label,
		onValueChange,
		onHistoryMark
	}: {
		value: number;
		steps: number;
		label?: string;
		onValueChange: (value: number) => void;
		onHistoryMark?: (id: string) => void;
	} = $props();

	function oninput(e: Event) {
		onValueChange(Number((e.currentTarget as HTMLInputElement).value));
	}
	function onpointerdown() {
		onHistoryMark?.('slider-start');
	}

	// Fraction of the track to the left of the thumb (0..1). Drives the
	// --tl-color-selected range fill via a gradient so the filled portion matches
	// tldraw's .tlui-slider__range without extra DOM (track stays a real input).
	const fill = $derived(steps > 0 ? Math.max(0, Math.min(1, value / steps)) : 0);
</script>

<input
	class="tlui-slider"
	type="range"
	min="0"
	max={steps}
	step="1"
	{value}
	aria-label={label}
	style="--tl-slider-fill: {fill * 100}%;"
	{oninput}
	{onpointerdown}
/>

<style>
	/* Ported from tldraw's .tlui-slider (ui.css:440-494): a 3px --tl-color-muted-1
	   rail with a --tl-color-selected filled range, and an 18px round thumb whose
	   ring is drawn with `box-shadow: inset 0 0 0 2px --tl-color-text-1`. The native
	   range input keeps all keyboard/a11y behavior; only the chrome is restyled. */
	.tlui-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 44px;
		margin: 0;
		background: transparent;
		cursor: pointer;
	}
	.tlui-slider:focus {
		outline: none;
	}

	/* --- Track (3px rail; filled portion = --tl-color-selected) --- */
	.tlui-slider::-webkit-slider-runnable-track {
		height: 3px;
		border-radius: 14px;
		background: linear-gradient(
				to right,
				var(--tl-color-selected, hsl(214, 84%, 56%)) var(--tl-slider-fill, 0%),
				var(--tl-color-muted-1, hsl(0, 0%, 0%, 10%)) var(--tl-slider-fill, 0%)
			)
			no-repeat;
	}
	.tlui-slider::-moz-range-track {
		height: 3px;
		border-radius: 14px;
		background-color: var(--tl-color-muted-1, hsl(0, 0%, 0%, 10%));
	}
	.tlui-slider::-moz-range-progress {
		height: 3px;
		border-radius: 14px;
		background-color: var(--tl-color-selected, hsl(214, 84%, 56%));
	}

	/* --- Thumb (18px round, inset 2px text-1 ring) --- */
	.tlui-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		/* Center the 18px thumb on the 3px rail. */
		margin-top: -7.5px;
		border: none;
		border-radius: 999px;
		background-color: var(--tl-color-panel, #fff);
		box-shadow: inset 0 0 0 2px var(--tl-color-text-1, hsl(0, 0%, 18%));
		cursor: grab;
	}
	.tlui-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 999px;
		background-color: var(--tl-color-panel, #fff);
		box-shadow: inset 0 0 0 2px var(--tl-color-text-1, hsl(0, 0%, 18%));
		cursor: grab;
	}
	.tlui-slider:active::-webkit-slider-thumb {
		cursor: grabbing;
		box-shadow:
			inset 0 0 0 2px var(--tl-color-text-1, hsl(0, 0%, 18%)),
			var(--tl-shadow-1);
	}
	.tlui-slider:active::-moz-range-thumb {
		cursor: grabbing;
		box-shadow:
			inset 0 0 0 2px var(--tl-color-text-1, hsl(0, 0%, 18%)),
			var(--tl-shadow-1);
	}
</style>
