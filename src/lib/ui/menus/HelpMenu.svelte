<script lang="ts">
	import Button from '../primitives/Button.svelte';
	import Popover from '../primitives/Popover.svelte';
	import MenuGroup from '../primitives/MenuGroup.svelte';
	import MenuItem from '../primitives/MenuItem.svelte';
	import Icon from '../Icon.svelte';
	import KeyboardShortcutsDialog from './KeyboardShortcutsDialog.svelte';
	import LanguageMenu from './LanguageMenu.svelte';

	// From-scratch HelpMenu (port of tldraw's DefaultHelpMenu): a "?" button in the
	// bottom-right that opens a small menu with the Language submenu + the Keyboard
	// shortcuts item (which opens the shortcuts dialog).
	let shortcutsOpen = $state(false);
</script>

<Popover side="top" align="end">
	{#snippet trigger({ toggle, props })}
		<Button
			type="icon"
			title="Help"
			ariaLabel="Help"
			onclick={toggle}
			{...props}
			data-testid="help-menu.button"
		>
			<Icon icon="question-mark" label="Help" />
		</Button>
	{/snippet}
	<MenuGroup>
		<LanguageMenu side="left" />
		<MenuItem label="Keyboard shortcuts" onSelect={() => (shortcutsOpen = true)} />
	</MenuGroup>
</Popover>

<KeyboardShortcutsDialog bind:open={shortcutsOpen} />
