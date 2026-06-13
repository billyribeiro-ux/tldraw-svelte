<script lang="ts">
	import { getActions, getTools } from '$lib/ui/context';
	import Dialog from '../primitives/Dialog.svelte';
	import Kbd from '../primitives/Kbd.svelte';

	// From-scratch KeyboardShortcutsDialog (faithful port of tldraw's
	// DefaultKeyboardShortcutsDialogContent). Reproduces upstream's GROUPED,
	// multi-column layout: the named groups (Tools, Preferences, Edit, View,
	// Transform, Text formatting, Accessibility — collaboration is skipped, no
	// collab UI here) flow into CSS columns, each group kept intact.
	//
	// Rows come from two sources:
	//   - registry rows look up a real action/tool by id and reuse its .label/.kbd
	//     (single source of truth — the same kbd strings Keybindings binds), and
	//   - static rows (text formatting, a11y, pointer-down, zoom-quick) carry a
	//     fixed { label, kbd } literal copied from upstream, since they have no
	//     registry entry.
	// The lookup is defensive: any id missing from the registry falls back to the
	// row's literal label/kbd so it still renders (never crash, never blank).
	//
	// Controlled via `bind:open` so the HelpMenu can open it (matching tldraw's
	// HelpMenu → shortcuts).
	let { open = $bindable(false) }: { open?: boolean } = $props();

	const actions = getActions();
	const tools = getTools();

	type Row = {
		/** Stable key + registry lookup id. */
		id: string;
		/** Where to look the id up (action/tool registry) — omitted for pure static rows. */
		source?: 'action' | 'tool';
		/** Fallback / static label (always provided). */
		label: string;
		/** Fallback / static kbd (always provided). */
		kbd: string;
	};

	type Group = { id: string; title: string; rows: Row[] };

	// Strip upstream's [[...]] placeholder brackets to a readable key, since our
	// Kbd component doesn't parse [[ ]] (e.g. "[[Tab]]" → "Tab",
	// "[[↑→↓←]]" → "↑ → ↓ ←", "[[1-6]]" → "1-6"). Arrow runs get spaced out.
	function stripBrackets(kbd: string): string {
		return kbd.replace(/\[\[(.+?)\]\]/g, (_, inner: string) => {
			if (/^[↑→↓←↕↔]+$/.test(inner)) return inner.split('').join(' ');
			return inner;
		});
	}

	// Resolve a row to its display { label, kbd }. Registry rows reuse the real
	// action/tool entry; if the id is missing (or the row is static) we fall back
	// to the row's own literal so nothing crashes or renders blank.
	function resolve(row: Row): { label: string; kbd: string } {
		if (row.source === 'action') {
			const a = actions[row.id];
			if (a) return { label: a.label, kbd: stripBrackets(a.kbd ?? row.kbd) };
		} else if (row.source === 'tool') {
			const t = tools[row.id];
			if (t) return { label: t.label, kbd: stripBrackets(t.kbd ?? row.kbd) };
		}
		return { label: row.label, kbd: stripBrackets(row.kbd) };
	}

	// The group + row list, mirroring DefaultKeyboardShortcutsDialogContent.tsx.
	// Registry rows carry a fallback label/kbd (used only if the id is absent);
	// upstream's `rectangle`/`ellipse` tools live here as `geo-rectangle`/
	// `geo-ellipse`, so those rows point at the real registry ids.
	const groups: Group[] = [
		{
			id: 'tools',
			title: 'Tools',
			rows: [
				{ id: 'toggle-tool-lock', source: 'action', label: 'Tool lock', kbd: 'q' },
				{ id: 'insert-media', source: 'action', label: 'Insert media', kbd: 'cmd+i' },
				{ id: 'select', source: 'tool', label: 'Select', kbd: 'v' },
				{ id: 'draw', source: 'tool', label: 'Draw', kbd: 'd,b,x' },
				{ id: 'eraser', source: 'tool', label: 'Eraser', kbd: 'e' },
				{ id: 'hand', source: 'tool', label: 'Hand', kbd: 'h' },
				{ id: 'geo-rectangle', source: 'tool', label: 'Rectangle', kbd: 'r' },
				{ id: 'geo-ellipse', source: 'tool', label: 'Ellipse', kbd: 'o' },
				{ id: 'arrow', source: 'tool', label: 'Arrow', kbd: 'a' },
				{ id: 'line', source: 'tool', label: 'Line', kbd: 'l' },
				{ id: 'text', source: 'tool', label: 'Text', kbd: 't' },
				{ id: 'frame', source: 'tool', label: 'Frame', kbd: 'f' },
				{ id: 'note', source: 'tool', label: 'Note', kbd: 'n' },
				{ id: 'laser', source: 'tool', label: 'Laser', kbd: 'k' },
				{ id: 'pointer-down', label: 'Pointer down', kbd: ',' }
			]
		},
		{
			id: 'preferences',
			title: 'Preferences',
			rows: [
				{ id: 'toggle-dark-mode', source: 'action', label: 'Dark mode', kbd: 'cmd+/' },
				{ id: 'toggle-focus-mode', source: 'action', label: 'Focus mode', kbd: 'cmd+.' },
				{ id: 'toggle-grid', source: 'action', label: 'Show grid', kbd: "cmd+'" }
			]
		},
		{
			id: 'edit',
			title: 'Edit',
			rows: [
				{ id: 'undo', source: 'action', label: 'Undo', kbd: 'cmd+z' },
				{ id: 'redo', source: 'action', label: 'Redo', kbd: 'cmd+shift+z' },
				{ id: 'cut', source: 'action', label: 'Cut', kbd: 'cmd+x' },
				{ id: 'copy', source: 'action', label: 'Copy', kbd: 'cmd+c' },
				{
					id: 'copy-hovered-styles',
					source: 'action',
					label: 'Copy hovered styles',
					kbd: 'cmd+shift+c'
				},
				{ id: 'paste', source: 'action', label: 'Paste', kbd: 'cmd+v' },
				{ id: 'select-all', source: 'action', label: 'Select all', kbd: 'cmd+a' },
				{ id: 'delete', source: 'action', label: 'Delete', kbd: 'Backspace' },
				{ id: 'duplicate', source: 'action', label: 'Duplicate', kbd: 'cmd+d' }
			]
		},
		{
			id: 'view',
			title: 'View',
			rows: [
				{ id: 'select-zoom-tool', source: 'action', label: 'Zoom tool', kbd: 'z' },
				{ id: 'zoom-in', source: 'action', label: 'Zoom in', kbd: 'cmd+=' },
				{ id: 'zoom-out', source: 'action', label: 'Zoom out', kbd: 'cmd+-' },
				{ id: 'zoom-to-100', source: 'action', label: 'Zoom to 100%', kbd: 'shift+0' },
				{ id: 'zoom-to-fit', source: 'action', label: 'Zoom to fit', kbd: 'shift+1' },
				{
					id: 'zoom-to-selection',
					source: 'action',
					label: 'Zoom to selection',
					kbd: 'shift+2'
				},
				{ id: 'zoom-quick', label: 'Zoom quick', kbd: 'shift+z' }
			]
		},
		{
			id: 'transform',
			title: 'Transform',
			rows: [
				{ id: 'bring-to-front', source: 'action', label: 'Bring to front', kbd: ']' },
				{ id: 'bring-forward', source: 'action', label: 'Bring forward', kbd: 'alt+]' },
				{ id: 'send-backward', source: 'action', label: 'Send backward', kbd: 'alt+[' },
				{ id: 'send-to-back', source: 'action', label: 'Send to back', kbd: '[' },
				{ id: 'group', source: 'action', label: 'Group', kbd: 'cmd+g' },
				{ id: 'ungroup', source: 'action', label: 'Ungroup', kbd: 'cmd+shift+g' },
				{ id: 'flip-horizontal', source: 'action', label: 'Flip horizontal', kbd: 'shift+h' },
				{ id: 'flip-vertical', source: 'action', label: 'Flip vertical', kbd: 'shift+v' },
				{ id: 'align-top', source: 'action', label: 'Align top', kbd: 'alt+w' },
				{
					id: 'align-center-vertical',
					source: 'action',
					label: 'Align center vertical',
					kbd: 'alt+v'
				},
				{ id: 'align-bottom', source: 'action', label: 'Align bottom', kbd: 'alt+s' },
				{ id: 'align-left', source: 'action', label: 'Align left', kbd: 'alt+a' },
				{
					id: 'align-center-horizontal',
					source: 'action',
					label: 'Align center horizontal',
					kbd: 'alt+h'
				},
				{ id: 'align-right', source: 'action', label: 'Align right', kbd: 'alt+d' }
			]
		},
		{
			id: 'text',
			title: 'Text formatting',
			rows: [
				{ id: 'text-bold', label: 'Bold', kbd: 'cmd+b' },
				{ id: 'text-italic', label: 'Italic', kbd: 'cmd+i' },
				{ id: 'text-code', label: 'Code', kbd: 'cmd+e' },
				{ id: 'text-highlight', label: 'Highlight', kbd: 'cmd+shift+h' },
				{ id: 'text-strikethrough', label: 'Strikethrough', kbd: 'cmd+shift+s' },
				{ id: 'text-link', label: 'Link', kbd: 'cmd+shift+k' },
				{ id: 'text-header', label: 'Header', kbd: 'cmd+alt+[[1-6]]' },
				{ id: 'text-orderedList', label: 'Ordered list', kbd: 'cmd+shift+7' },
				{ id: 'text-bulletedlist', label: 'Bulleted list', kbd: 'cmd+shift+8' }
			]
		},
		{
			id: 'a11y',
			title: 'Accessibility',
			rows: [
				{ id: 'a11y-select-next-shape', label: 'Select shape', kbd: '[[Tab]]' },
				{
					id: 'a11y-select-next-shape-direction',
					label: 'Select shape (direction)',
					kbd: 'cmd+[[↑→↓←]]'
				},
				{
					id: 'a11y-select-next-shape-container',
					label: 'Enter / leave container',
					kbd: 'cmd+shift+[[↑↓]]'
				},
				{ id: 'a11y-pan-camera', label: 'Pan camera', kbd: '[[Space]]+[[↑→↓←]]' },
				{ id: 'adjust-shape-styles', label: 'Adjust shape styles', kbd: 'cmd+[[Enter]]' },
				{ id: 'open-context-menu', label: 'Open context menu', kbd: 'cmd+shift+[[Enter]]' },
				{ id: 'a11y-move-shape', label: 'Move shape', kbd: '[[↑→↓←]]' },
				{ id: 'a11y-move-shape-faster', label: 'Move shape faster', kbd: 'shift+[[↑→↓←]]' },
				{ id: 'a11y-rotate-shape-cw', label: 'Rotate shape clockwise', kbd: 'shift+﹥' },
				{
					id: 'a11y-rotate-shape-cw-fine',
					label: 'Rotate shape clockwise (fine)',
					kbd: 'shift+alt+﹥'
				},
				{
					id: 'a11y-rotate-shape-ccw',
					label: 'Rotate shape counter-clockwise',
					kbd: 'shift+﹤'
				},
				{
					id: 'a11y-rotate-shape-ccw-fine',
					label: 'Rotate shape counter-clockwise (fine)',
					kbd: 'shift+alt+﹤'
				},
				{ id: 'enlarge-shapes', source: 'action', label: 'Enlarge shapes', kbd: 'cmd+shift+=' },
				{ id: 'shrink-shapes', source: 'action', label: 'Shrink shapes', kbd: 'cmd+shift+-' },
				{
					id: 'a11y-repeat-shape-announce',
					source: 'action',
					label: 'Repeat shape announcement',
					kbd: 'alt+r'
				},
				{
					id: 'a11y-open-keyboard-shortcuts',
					label: 'Open keyboard shortcuts',
					kbd: 'cmd+alt+/'
				}
			]
		}
	];
</script>

{#if open}
	<Dialog title="Keyboard shortcuts" onClose={() => (open = false)}>
		<div class="tlui-shortcuts-dialog__body" data-testid="shortcuts.dialog">
			{#each groups as group (group.id)}
				<div class="tlui-shortcuts-dialog__group">
					<h2 class="tlui-shortcuts-dialog__group__title">{group.title}</h2>
					<div class="tlui-shortcuts-dialog__group__content">
						{#each group.rows as row (row.id)}
							{@const r = resolve(row)}
							<div class="tlui-shortcuts-dialog__key-pair">
								<div class="tlui-shortcuts-dialog__key-pair__key">{r.label}</div>
								<Kbd kbd={r.kbd} />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</Dialog>
{/if}

<style>
	/* Mirrors tldraw ui.css `.tlui-shortcuts-dialog__*`: the body is a multi-column
	   flow (2 columns here), each group kept intact via break-inside. */
	.tlui-shortcuts-dialog__body {
		position: relative;
		columns: 2;
		column-gap: var(--tl-space-9, 36px);
		font: 500 13px/1 var(--tl-font-sans);
		min-width: 480px;
		max-width: 640px;
	}
	.tlui-shortcuts-dialog__group {
		break-inside: avoid-column;
		padding-bottom: var(--tl-space-6, 20px);
	}
	.tlui-shortcuts-dialog__group__title {
		font-size: inherit;
		font-weight: inherit;
		margin: 0;
		color: var(--tl-color-text-3, #6b6b6b);
		height: 32px;
		display: flex;
		align-items: center;
	}
	.tlui-shortcuts-dialog__group__content {
		display: flex;
		flex-direction: column;
		color: var(--tl-color-text-1, #1d1d1d);
	}
	.tlui-shortcuts-dialog__key-pair {
		display: flex;
		gap: var(--tl-space-4, 12px);
		align-items: center;
		justify-content: space-between;
		height: 32px;
	}
	.tlui-shortcuts-dialog__key-pair__key {
		flex: 1;
		font-size: 12px;
	}

	@media (max-width: 640px) {
		.tlui-shortcuts-dialog__body {
			columns: 1;
			min-width: 0;
		}
	}
</style>
