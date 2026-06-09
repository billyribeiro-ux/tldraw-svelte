<script lang="ts">
	import type { Editor } from '@tldraw/editor';
	import TldrawEditor from './canvas/TldrawEditor.svelte';
	import TldrawUi from './ui/TldrawUi.svelte';

	// Top-level component an app consumes, mirroring React tldraw's <Tldraw>:
	// the editor canvas + the from-scratch UI (TldrawUi) composed on top. The UI
	// is built phase by phase (toolbar/keybindings now; menus, style panel,
	// minimap, dialogs, toasts as they land).
	let {
		oncreate,
		persistenceKey
	}: { oncreate?: (editor: Editor) => void; persistenceKey?: string } = $props();
</script>

<TldrawEditor {oncreate} {persistenceKey}>
	<TldrawUi />
</TldrawEditor>
