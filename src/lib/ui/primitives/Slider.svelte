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
</script>

<input
	class="tlui-slider"
	type="range"
	min="0"
	max={steps}
	step="1"
	{value}
	aria-label={label}
	{oninput}
	{onpointerdown}
/>

<style>
	.tlui-slider {
		width: 100%;
		height: 28px;
		accent-color: var(--tl-color-selected, #4465e9);
		cursor: pointer;
	}
</style>
