<script lang="ts">
	// Dev harness for the from-scratch UI primitives (Phase A evidence). Not part
	// of the editor; lets Playwright drive each primitive in isolation.
	import Button from '$lib/ui/primitives/Button.svelte';
	import Popover from '$lib/ui/primitives/Popover.svelte';
	import MenuItem from '$lib/ui/primitives/MenuItem.svelte';
	import Slider from '$lib/ui/primitives/Slider.svelte';
	import Dialog from '$lib/ui/primitives/Dialog.svelte';

	let sliderValue = $state(3);
	let dialogOpen = $state(false);
	let lastAction = $state('');
</script>

<svelte:head><title>primitives</title></svelte:head>

<main style="padding: 24px; font-family: system-ui;">
	<h1>UI primitives</h1>

	<section data-test="buttons">
		<Button type="primary" onclick={() => (lastAction = 'primary')}>Primary</Button>
		<Button type="normal" isActive onclick={() => (lastAction = 'active')}>Active</Button>
		<Button type="danger" disabled>Disabled</Button>
	</section>

	<section data-test="popover" style="margin-top: 16px;">
		<Popover>
			{#snippet trigger({ toggle, props })}
				<button data-test="popover-trigger" onclick={toggle} {...props}>Open menu</button>
			{/snippet}
			<MenuItem label="Item A" kbd="$a" onSelect={() => (lastAction = 'item-a')} />
			<MenuItem label="Item B" checked={true} onSelect={() => (lastAction = 'item-b')} />
		</Popover>
	</section>

	<section data-test="slider" style="margin-top: 16px; width: 200px;">
		<Slider
			value={sliderValue}
			steps={5}
			label="Opacity"
			onValueChange={(v) => (sliderValue = v)}
		/>
		<output data-test="slider-value">{sliderValue}</output>
	</section>

	<section data-test="dialog" style="margin-top: 16px;">
		<Button onclick={() => (dialogOpen = true)} data-test="open-dialog">Open dialog</Button>
		{#if dialogOpen}
			<Dialog title="Test dialog" bind:open={dialogOpen} onClose={() => (lastAction = 'dialog-closed')}>
				<p>Dialog body</p>
				<input data-test="dialog-input" placeholder="type here" />
			</Dialog>
		{/if}
	</section>

	<output data-test="last-action">{lastAction}</output>
</main>
