<script lang="ts">
	import { iconUrl } from './icon-map';

	// From-scratch port of tldraw's TldrawUiIcon — renders a tldraw icon SVG via a
	// CSS mask tinted by `currentColor`, exactly as the original does (no icon font,
	// no inline SVG). `small` matches tldraw's 15px variant; default is 18px.
	let {
		icon,
		small = false,
		invertIcon = false,
		label
	}: {
		icon: string;
		small?: boolean;
		invertIcon?: boolean;
		label?: string;
	} = $props();

	const url = $derived(iconUrl(icon));
	const size = $derived(small ? '15px' : '18px');
</script>

<div
	class="tlui-icon"
	class:tlui-icon--invert={invertIcon}
	role="img"
	aria-label={label}
	aria-hidden={label ? undefined : true}
	style:width={size}
	style:height={size}
	style:--tl-icon-url="url({url})"
></div>

<style>
	/* tldraw's mask technique: the SVG is a mask over the current text color, so the
	   icon inherits color (selected/hover states) just like the original. */
	.tlui-icon {
		flex: 0 0 auto;
		background-color: currentColor;
		mask-image: var(--tl-icon-url);
		mask-size: 100%;
		mask-repeat: no-repeat;
		mask-position: center;
		-webkit-mask-image: var(--tl-icon-url);
		-webkit-mask-size: 100%;
		-webkit-mask-repeat: no-repeat;
		-webkit-mask-position: center;
	}
	.tlui-icon--invert {
		transform: scale(-1, 1);
	}
</style>
