import { createContext } from 'svelte';
import type { Editor } from '@tldraw/editor';

/**
 * A reactive holder for the active {@link Editor}. The editor can only be
 * constructed once its container element is mounted (it needs viewport bounds),
 * which is after component init — but Svelte context must be SET during init.
 * So `TldrawEditor.svelte` sets this holder during init and fills `.editor` on
 * mount; descendants read `getEditorContext().editor` reactively (it's `$state`,
 * so they update when the editor becomes available).
 */
export class EditorHolder {
	editor = $state<Editor | undefined>(undefined);
}

/**
 * Svelte context carrying the {@link EditorHolder}, replacing
 * `@tldraw/editor`'s React `EditorProvider` / `useEditor()`.
 *
 * @see https://svelte.dev/docs/svelte/context#createContext
 */
export const [getEditorContext, setEditorContext] = createContext<EditorHolder>();

/**
 * Convenience for descendant components that require the editor to exist. Throws
 * if read before the editor is mounted — callers inside the canvas tree are only
 * rendered once `holder.editor` is set, so this is safe there.
 */
export function getEditor(): Editor {
	const holder = getEditorContext();
	if (!holder.editor) {
		throw new Error('getEditor() called before the editor was mounted');
	}
	return holder.editor;
}
