import { createContext } from 'svelte';
import type { Editor } from '@tldraw/editor';
import type { ToastStore } from './toasts.svelte';
import { downloadSvg, downloadPng } from '$lib/export/svg-export';

/**
 * An editor action — the from-scratch port of tldraw's `TLUiActionItem`. Menus,
 * the toolbar, and keyboard shortcuts all bind to these by id. `onSelect`'s body
 * is the real editor operation (framework-free); `source` records where it was
 * triggered ('menu' | 'kbd' | 'context-menu' | 'toolbar').
 *
 * @public
 */
export interface ActionItem {
	id: string;
	label: string;
	icon?: string;
	kbd?: string;
	readonlyOk?: boolean;
	checkbox?: boolean;
	onSelect(source: string): void;
}

export type ActionsRegistry = Record<string, ActionItem>;

/** Context holding the actions registry. Set by the UI root, read by menus etc. */
export const [getActions, setActions] = createContext<ActionsRegistry>();

/**
 * Build the default actions registry from a real editor. Ported 1:1 from
 * tldraw's `actions.tsx` `onSelect` bodies (the editor calls), minus telemetry.
 * This is the core set the menus/toolbar/shortcuts need; more slot in trivially.
 */
export function createDefaultActions(editor: Editor, toasts?: ToastStore): ActionsRegistry {
	// In-memory clipboard for cut/copy/paste. tldraw also bridges the system
	// clipboard; this from-scratch port keeps the content in-app (reliable, no
	// permissions prompt) and pastes near the viewport center, like tldraw.
	let clipboard: import('@tldraw/editor').TLContent | undefined;

	function copySelection() {
		const ids = editor.getSelectedShapeIds();
		if (!ids.length) return false;
		clipboard = editor.getContentFromCurrentPage(ids);
		return !!clipboard;
	}

	const actions: ActionItem[] = [
		// --- history ---
		{ id: 'undo', label: 'Undo', icon: 'undo', kbd: '$z', onSelect: () => void editor.undo() },
		{
			id: 'redo',
			label: 'Redo',
			icon: 'redo',
			kbd: '$!z',
			onSelect: () => void editor.redo()
		},
		// --- clipboard / selection ---
		{
			id: 'delete',
			label: 'Delete',
			icon: 'trash',
			kbd: '⌫',
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				if (ids.length) editor.deleteShapes(ids);
			}
		},
		{
			id: 'duplicate',
			label: 'Duplicate',
			icon: 'duplicate',
			kbd: '$d',
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				if (!ids.length) return;
				// Offset the copies one selection-width to the right (plus a small
				// margin), matching tldraw's duplicate behavior, instead of the old
				// hardcoded 16,16. Falls back to a small offset if bounds are missing.
				const bounds = editor.getSelectionPageBounds();
				const offset = bounds ? { x: bounds.width + 16, y: 0 } : { x: 16, y: 16 };
				editor.markHistoryStoppingPoint('duplicate shapes');
				editor.duplicateShapes(ids, offset);
			}
		},
		{
			id: 'select-all',
			label: 'Select all',
			kbd: '$a',
			onSelect: () => editor.selectAll()
		},
		{
			id: 'select-none',
			label: 'Select none',
			onSelect: () => editor.selectNone()
		},
		// --- clipboard ---
		{
			id: 'copy',
			label: 'Copy',
			icon: 'duplicate',
			kbd: '$c',
			onSelect: () => void copySelection()
		},
		{
			id: 'cut',
			label: 'Cut',
			icon: 'trash',
			kbd: '$x',
			onSelect: () => {
				if (copySelection()) {
					editor.markHistoryStoppingPoint('cut');
					editor.deleteShapes(editor.getSelectedShapeIds());
				}
			}
		},
		{
			id: 'paste',
			label: 'Paste',
			kbd: '$v',
			onSelect: () => {
				if (!clipboard) return;
				editor.markHistoryStoppingPoint('paste');
				// Paste at the viewport center, matching tldraw's keyboard paste.
				const center = editor.getViewportPageBounds().center;
				editor.putContentOntoCurrentPage(clipboard, { point: center, select: true });
			}
		},
		// --- grouping ---
		{
			id: 'group',
			label: 'Group',
			icon: 'group',
			kbd: '$g',
			onSelect: () => {
				// Toggle: if exactly one group is selected, ungroup it; otherwise group
				// the current selection (matching tldraw's `group` action).
				const onlySelected = editor.getOnlySelectedShape();
				if (onlySelected && editor.isShapeOfType(onlySelected, 'group')) {
					editor.markHistoryStoppingPoint('ungroup');
					editor.ungroupShapes(editor.getSelectedShapeIds());
				} else {
					const ids = editor.getSelectedShapeIds();
					if (ids.length > 1) {
						editor.markHistoryStoppingPoint('group');
						editor.groupShapes(ids);
					}
				}
			}
		},
		{
			id: 'ungroup',
			label: 'Ungroup',
			icon: 'ungroup',
			kbd: '$!g',
			onSelect: () => {
				editor.markHistoryStoppingPoint('ungroup');
				editor.ungroupShapes(editor.getSelectedShapeIds());
			}
		},
		// --- arrange ---
		{
			id: 'align-left',
			label: 'Align left',
			icon: 'align-left',
			kbd: '?a',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'left')
		},
		{
			id: 'align-center-horizontal',
			label: 'Align center horizontal',
			icon: 'align-center-horizontal',
			kbd: '?h',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'center-horizontal')
		},
		{
			id: 'align-right',
			label: 'Align right',
			icon: 'align-right',
			kbd: '?d',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'right')
		},
		{
			id: 'align-top',
			label: 'Align top',
			icon: 'align-top',
			kbd: '?w',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'top')
		},
		{
			id: 'align-center-vertical',
			label: 'Align center vertical',
			icon: 'align-center-vertical',
			kbd: '?v',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'center-vertical')
		},
		{
			id: 'align-bottom',
			label: 'Align bottom',
			icon: 'align-bottom',
			kbd: '?s',
			onSelect: () => editor.alignShapes(editor.getSelectedShapeIds(), 'bottom')
		},
		{
			id: 'stretch-horizontal',
			label: 'Stretch horizontally',
			icon: 'stretch-horizontal',
			onSelect: () => editor.stretchShapes(editor.getSelectedShapeIds(), 'horizontal')
		},
		{
			id: 'stretch-vertical',
			label: 'Stretch vertically',
			icon: 'stretch-vertical',
			onSelect: () => editor.stretchShapes(editor.getSelectedShapeIds(), 'vertical')
		},
		{
			id: 'distribute-horizontal',
			label: 'Distribute horizontally',
			icon: 'distribute-horizontal',
			kbd: '!?h',
			onSelect: () => editor.distributeShapes(editor.getSelectedShapeIds(), 'horizontal')
		},
		{
			id: 'distribute-vertical',
			label: 'Distribute vertically',
			icon: 'distribute-vertical',
			kbd: '!?v',
			onSelect: () => editor.distributeShapes(editor.getSelectedShapeIds(), 'vertical')
		},
		{
			id: 'stack-horizontal',
			label: 'Stack horizontally',
			icon: 'stack-horizontal',
			onSelect: () => editor.stackShapes(editor.getSelectedShapeIds(), 'horizontal', 16)
		},
		{
			id: 'stack-vertical',
			label: 'Stack vertically',
			icon: 'stack-vertical',
			onSelect: () => editor.stackShapes(editor.getSelectedShapeIds(), 'vertical', 16)
		},
		// --- reorder ---
		{
			id: 'bring-to-front',
			label: 'Bring to front',
			icon: 'bring-to-front',
			kbd: ']',
			onSelect: () => editor.bringToFront(editor.getSelectedShapeIds())
		},
		{
			id: 'bring-forward',
			label: 'Bring forward',
			icon: 'bring-forward',
			kbd: '?]',
			onSelect: () => editor.bringForward(editor.getSelectedShapeIds())
		},
		{
			id: 'send-backward',
			label: 'Send backward',
			icon: 'send-backward',
			kbd: '?[',
			onSelect: () => editor.sendBackward(editor.getSelectedShapeIds())
		},
		{
			id: 'send-to-back',
			label: 'Send to back',
			icon: 'send-to-back',
			kbd: '[',
			onSelect: () => editor.sendToBack(editor.getSelectedShapeIds())
		},
		// --- rotate ---
		{
			id: 'rotate-cw',
			label: 'Rotate clockwise',
			icon: 'rotate-cw',
			kbd: '!.',
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				if (ids.length) {
					editor.markHistoryStoppingPoint('rotate-cw');
					editor.rotateShapesBy(ids, Math.PI / 2);
				}
			}
		},
		{
			id: 'rotate-ccw',
			label: 'Rotate counter-clockwise',
			icon: 'rotate-ccw',
			kbd: '!,',
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				if (ids.length) {
					editor.markHistoryStoppingPoint('rotate-ccw');
					editor.rotateShapesBy(ids, -(Math.PI / 2));
				}
			}
		},
		// --- flip ---
		{
			id: 'flip-horizontal',
			label: 'Flip horizontal',
			kbd: '!h',
			onSelect: () => editor.flipShapes(editor.getSelectedShapeIds(), 'horizontal')
		},
		{
			id: 'flip-vertical',
			label: 'Flip vertical',
			kbd: '!v',
			onSelect: () => editor.flipShapes(editor.getSelectedShapeIds(), 'vertical')
		},
		// --- view ---
		{
			id: 'zoom-in',
			label: 'Zoom in',
			icon: 'zoom-in',
			kbd: '$=,=',
			readonlyOk: true,
			onSelect: () => editor.zoomIn()
		},
		{
			id: 'zoom-out',
			label: 'Zoom out',
			icon: 'zoom-out',
			kbd: '$-,-',
			readonlyOk: true,
			onSelect: () => editor.zoomOut()
		},
		{
			id: 'zoom-to-100',
			label: 'Zoom to 100%',
			icon: 'reset-zoom',
			kbd: '!0',
			readonlyOk: true,
			onSelect: () => editor.resetZoom()
		},
		{
			id: 'zoom-to-fit',
			label: 'Zoom to fit',
			kbd: '!1',
			readonlyOk: true,
			onSelect: () => editor.zoomToFit()
		},
		{
			id: 'zoom-to-selection',
			label: 'Zoom to selection',
			kbd: '!2',
			readonlyOk: true,
			onSelect: () => editor.zoomToSelection()
		},
		{
			id: 'toggle-grid',
			label: 'Show grid',
			kbd: "$'",
			checkbox: true,
			readonlyOk: true,
			onSelect: () =>
				editor.updateInstanceState({ isGridMode: !editor.getInstanceState().isGridMode })
		},
		{
			id: 'toggle-tool-lock',
			label: 'Tool lock',
			kbd: 'q',
			checkbox: true,
			onSelect: () =>
				editor.updateInstanceState({ isToolLocked: !editor.getInstanceState().isToolLocked })
		},
		{
			id: 'toggle-snap-mode',
			label: 'Snap mode',
			checkbox: true,
			onSelect: () =>
				editor.user.updateUserPreferences({ isSnapMode: !editor.user.getIsSnapMode() })
		},
		{
			id: 'toggle-debug-mode',
			label: 'Debug mode',
			checkbox: true,
			readonlyOk: true,
			onSelect: () =>
				editor.updateInstanceState({ isDebugMode: !editor.getInstanceState().isDebugMode })
		},
		{
			id: 'toggle-dark-mode',
			label: 'Dark mode',
			kbd: '$/',
			checkbox: true,
			readonlyOk: true,
			onSelect: () => {
				const dark = editor.user.getIsDarkMode();
				editor.user.updateUserPreferences({ colorScheme: dark ? 'light' : 'dark' });
			}
		},
		// --- export (from-scratch SVG export; see $lib/export/svg-export) ---
		{
			id: 'export-as-svg',
			label: 'Export as SVG',
			readonlyOk: true,
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				const target = ids.length ? ids : [...editor.getCurrentPageShapeIds()];
				if (!target.length) {
					toasts?.add({
						title: 'Nothing to export',
						description: 'Add a shape to the canvas first.',
						severity: 'warning'
					});
					return;
				}
				const ok = downloadSvg(editor, ids.length ? ids : undefined);
				toasts?.add(
					ok
						? {
								title: 'Exported as SVG',
								description: `${target.length} shape${target.length === 1 ? '' : 's'} downloaded.`,
								severity: 'success'
							}
						: { title: 'Export failed', severity: 'error' }
				);
			}
		},
		{
			id: 'export-as-png',
			label: 'Export as PNG',
			readonlyOk: true,
			onSelect: () => {
				const ids = editor.getSelectedShapeIds();
				const target = ids.length ? ids : [...editor.getCurrentPageShapeIds()];
				if (!target.length) {
					toasts?.add({
						title: 'Nothing to export',
						description: 'Add a shape to the canvas first.',
						severity: 'warning'
					});
					return;
				}
				// PNG rasterisation is async; surface the result via a toast.
				downloadPng(editor, ids.length ? ids : undefined)
					.then((ok) =>
						toasts?.add(
							ok
								? {
										title: 'Exported as PNG',
										description: `${target.length} shape${target.length === 1 ? '' : 's'} downloaded.`,
										severity: 'success'
									}
								: { title: 'Export failed', severity: 'error' }
						)
					)
					.catch(() => toasts?.add({ title: 'Export failed', severity: 'error' }));
			}
		}
	];

	const registry: ActionsRegistry = {};
	for (const a of actions) registry[a.id] = a;
	return registry;
}
