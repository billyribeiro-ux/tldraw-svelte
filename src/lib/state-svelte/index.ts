// state-svelte: the runes bridge replacing @tldraw/state-react.
//
// Maps tldraw's @tldraw/state signals into Svelte 5 reactivity:
//   useValue(signal)        -> fromSignal(signal).current
//   useValue(name, fn, deps)-> fromComputed(name, fn).current
//   useQuickReactor         -> quickReactor (inside $effect / {@attach})
//   useReactor              -> rafReactor
//   useEditor() context     -> getEditor() / setEditor()

export { ReactiveSignal, fromSignal, fromComputed } from './use-value.svelte';
export { quickReactor, rafReactor, react } from './reactor.svelte';
export {
	getEditor,
	getEditorContext,
	setEditorContext,
	EditorHolder
} from './editor-context.svelte';
