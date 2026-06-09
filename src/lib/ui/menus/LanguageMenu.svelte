<script lang="ts">
	import { LANGUAGES } from '@tldraw/editor';
	import { getEditor } from '$lib/ui/context';
	import { fromComputed } from '$lib/state-svelte/use-value.svelte';
	import Submenu from '../primitives/Submenu.svelte';
	import MenuItem from '../primitives/MenuItem.svelte';

	// From-scratch LanguageMenu (port of tldraw's): a "Language" submenu listing every
	// shipped locale as a checkbox item, marked by the editor's current locale and
	// setting editor.user.updateUserPreferences({ locale }) — exactly like tldraw.
	let { side = 'right' }: { side?: 'right' | 'left' } = $props();

	const editor = getEditor();
	const currentLocale = fromComputed('locale', () => editor.user.getLocale());
</script>

<Submenu label="Language" {side}>
	{#each LANGUAGES as lang (lang.locale)}
		<MenuItem
			label={lang.label}
			checked={lang.locale === currentLocale.current}
			onSelect={() => editor.user.updateUserPreferences({ locale: lang.locale })}
		/>
	{/each}
</Submenu>
