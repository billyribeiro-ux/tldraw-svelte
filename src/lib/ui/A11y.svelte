<script lang="ts">
	import { getA11y } from '$lib/ui/context';

	// From-scratch accessibility live region (port of tldraw's A11y). A visually-
	// hidden element whose aria-live politeness + text come from the reactive
	// announcer, so screen readers announce UI changes that aren't focusable.
	const a11y = getA11y();
</script>

<div class="tlui-a11y" aria-live={a11y.priority} aria-atomic="true" data-testid="a11y-live-region">
	{a11y.message}
</div>

<style>
	/* Visually hidden but available to assistive tech (standard sr-only pattern). */
	.tlui-a11y {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
